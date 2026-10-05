// Package sanitize: allowlist sanitizer untuk SVG upload dan HTML konten.
// Menutup stored XSS (H1, H2): hanya elemen/atribut dikenal yang lolos,
// event handler (on*), javascript: URL, <script>/<style>/<foreignObject>,
// dan processing instruction selalu dibuang.
package sanitize

import (
	"strings"

	"golang.org/x/net/html"
)

// Elemen SVG yang diizinkan (presentasi + struktur dasar, tanpa script/style).
var svgTags = map[string]bool{
	"svg": true, "g": true, "defs": true, "title": true, "desc": true,
	"rect": true, "circle": true, "ellipse": true, "line": true,
	"polyline": true, "polygon": true, "path": true, "text": true,
	"tspan": true, "use": true, "image": true, "clipPath": true,
	"mask": true, "pattern": true, "linearGradient": true,
	"radialGradient": true, "stop": true,
}

// Elemen HTML konten yang diizinkan (output TipTap + format dasar).
var htmlTags = map[string]bool{
	"p": true, "br": true, "hr": true,
	"h1": true, "h2": true, "h3": true, "h4": true,
	"ul": true, "ol": true, "li": true,
	"blockquote": true, "pre": true, "code": true,
	"strong": true, "b": true, "em": true, "i": true,
	"u": true, "s": true, "strike": true, "a": true,
	"img": true, "figure": true, "figcaption": true,
	"table": true, "thead": true, "tbody": true, "tr": true, "th": true, "td": true,
	"span": true, "div": true,
}

// Atribut presentasi/struktur yang aman (tanpa satupun on*).
var safeAttrs = map[string]bool{
	"x": true, "y": true, "width": true, "height": true, "rx": true, "ry": true,
	"cx": true, "cy": true, "r": true, "x1": true, "y1": true, "x2": true, "y2": true,
	"d": true, "points": true, "fill": true, "stroke": true, "stroke-width": true,
	"stroke-linecap": true, "stroke-linejoin": true, "stroke-dasharray": true,
	"stroke-dashoffset": true, "opacity": true, "fill-opacity": true, "stroke-opacity": true,
	"font-size": true, "font-weight": true, "font-family": true, "text-anchor": true,
	"transform": true, "viewBox": true, "preserveAspectRatio": true,
	"offset": true, "stop-color": true, "stop-opacity": true,
	"alt": true, "title": true, "class": true, "id": true,
	"href": true, "src": true, "colspan": true, "rowspan": true,
	"target": true, "rel": true,
}

func safeURL(v, attr string) bool {
	v = strings.TrimSpace(strings.ToLower(v))
	if v == "" {
		return true
	}
	if strings.HasPrefix(v, "javascript:") || strings.HasPrefix(v, "data:text/html") ||
		strings.HasPrefix(v, "vbscript:") {
		return false
	}
	if attr == "href" {
		return strings.HasPrefix(v, "http://") || strings.HasPrefix(v, "https://") ||
			strings.HasPrefix(v, "mailto:") || strings.HasPrefix(v, "#") || strings.HasPrefix(v, "/")
	}
	// src: izinkan http(s), blob (upload fresh), dan path relatif/uploads
	return strings.HasPrefix(v, "http://") || strings.HasPrefix(v, "https://") ||
		strings.HasPrefix(v, "blob:") || strings.HasPrefix(v, "/") ||
		(!strings.Contains(v, ":") && !strings.HasPrefix(v, "//"))
}

func cleanAttr(tag string, a html.Attribute) (html.Attribute, bool) {
	k := strings.ToLower(a.Key)
	if strings.HasPrefix(k, "on") {
		return a, false
	}
	if k == "style" {
		// style inline rawan (expression/url) — buang seluruhnya
		return a, false
	}
	if !safeAttrs[k] {
		return a, false
	}
	if k == "href" || k == "src" {
		if !safeURL(a.Val, k) {
			return a, false
		}
		if k == "href" && (strings.HasPrefix(strings.ToLower(strings.TrimSpace(a.Val)), "http://") ||
			strings.HasPrefix(strings.ToLower(strings.TrimSpace(a.Val)), "https://")) {
			// rel aman ditambah saat render? biarkan atribut asli; caller boleh tambah rel.
			_ = tag
		}
	}
	return html.Attribute{Namespace: "", Key: k, Val: a.Val}, true
}

func sanitizeChildren(n *html.Node, allowed map[string]bool) {
	for c := n.FirstChild; c != nil; {
		next := c.NextSibling
		switch c.Type {
		case html.CommentNode:
			n.RemoveChild(c)
		case html.TextNode:
			// teks selalu aman
		case html.ElementNode:
			tag := strings.ToLower(c.Data)
			if !allowed[tag] {
				// ganti elemen terlarang dengan anak-anaknya (unwrap),
				// kecuali script/style yang dibuang beserta isinya
				if tag == "script" || tag == "style" || tag == "iframe" ||
					tag == "object" || tag == "embed" || tag == "foreignobject" ||
					tag == "link" || tag == "meta" {
					n.RemoveChild(c)
				} else {
					var first *html.Node
					for gc := c.FirstChild; gc != nil; {
						gn := gc.NextSibling
						c.RemoveChild(gc)
						n.InsertBefore(gc, c)
						if first == nil {
							first = gc
						}
						gc = gn
					}
					n.RemoveChild(c)
					// lanjutkan dari anak pertama yang dinaikkan agar ikut dibersihkan
					if first != nil {
						next = first
					}
				}
				break
			}
			attrs := []html.Attribute{}
			for _, a := range c.Attr {
				if na, ok := cleanAttr(tag, a); ok {
					attrs = append(attrs, na)
				}
			}
			c.Attr = attrs
			sanitizeNode(c, allowed)
		default:
			// doctype/PI/directive: buang
			n.RemoveChild(c)
		}
		c = next
	}
}

func sanitizeNode(n *html.Node, allowed map[string]bool) {
	sanitizeChildren(n, allowed)
}

// SanitizeSVG membersihkan markup SVG upload.
func SanitizeSVG(input string) string {
	doc, err := html.Parse(strings.NewReader(input))
	if err != nil {
		return ""
	}
	sanitizeNode(doc, svgTags)
	// ambil elemen <svg> pertama agar output tetap satu dokumen SVG
	var out strings.Builder
	var find func(*html.Node) *html.Node
	find = func(n *html.Node) *html.Node {
		if n.Type == html.ElementNode && strings.ToLower(n.Data) == "svg" {
			return n
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			if f := find(c); f != nil {
				return f
			}
		}
		return nil
	}
	if svg := find(doc); svg != nil {
		_ = html.Render(&out, svg)
		return out.String()
	}
	return ""
}

// SanitizeHTML membersihkan konten artikel/case study.
func SanitizeHTML(input string) string {
	if strings.TrimSpace(input) == "" {
		return ""
	}
	doc, err := html.Parse(strings.NewReader(input))
	if err != nil {
		return ""
	}
	// bersihkan isi <body> tanpa menghapus body-nya sendiri
	var body *html.Node
	var findBody func(*html.Node)
	findBody = func(n *html.Node) {
		if n.Type == html.ElementNode && strings.ToLower(n.Data) == "body" {
			body = n
			return
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			if body == nil {
				findBody(c)
			}
		}
	}
	findBody(doc)
	if body == nil {
		return ""
	}
	sanitizeChildren(body, htmlTags)
	var b strings.Builder
	for c := body.FirstChild; c != nil; c = c.NextSibling {
		_ = html.Render(&b, c)
	}
	return b.String()
}

// Clean menerima any (string disanitasi, selain itu lolos apa adanya).
func Clean(v any) any {
	s, ok := v.(string)
	if !ok {
		return v
	}
	return SanitizeHTML(s)
}
