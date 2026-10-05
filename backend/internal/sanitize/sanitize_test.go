package sanitize

import (
	"strings"
	"testing"
)

func TestSVG(t *testing.T) {
	in := `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><rect width="10" onclick="x()" fill="red"/><foreignObject><body xmlns="http://www.w3.org/1999/xhtml">x</body></foreignObject><a href="javascript:alert(3)"><text>hi</text></a></svg>`
	out := SanitizeSVG(in)
	for _, bad := range []string{"<script", "onload", "onclick", "foreignObject", "foreignobject", "javascript:"} {
		if strings.Contains(strings.ToLower(out), bad) {
			t.Fatalf("masih ada %q di: %s", bad, out)
		}
	}
	if !strings.Contains(out, "<rect") || !strings.Contains(out, "<svg") {
		t.Fatalf("elemen valid hilang: %s", out)
	}
}

func TestHTML(t *testing.T) {
	in := `<p>halo</p><script>alert(1)</script><img src="x" onerror="a()"><a href="javascript:alert(2)">k</a><figure><img src="/uploads/a.webp"><figcaption>cap</figcaption></figure>`
	out := SanitizeHTML(in)
	for _, bad := range []string{"<script", "onerror", "javascript:"} {
		if strings.Contains(out, bad) {
			t.Fatalf("masih ada %q di: %s", bad, out)
		}
	}
	for _, good := range []string{"<p>halo</p>", "<figure>", "<figcaption>cap</figcaption>", "<img"} {
		if !strings.Contains(out, good) {
			t.Fatalf("hilang %q dari: %s", good, out)
		}
	}
}
