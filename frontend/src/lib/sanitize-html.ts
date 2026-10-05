// Allowlist sanitizer sisi-klien (pertahanan lapis 2; server sudah
// membersihkan saat tulis + baca). Tanpa dependensi — pakai DOMParser.
const TAGS = new Set([
  "p", "br", "hr", "h1", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "strong", "b", "em", "i", "u", "s", "strike", "a",
  "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
]);

const ATTRS = new Set([
  "href", "src", "alt", "title", "class", "id", "colspan", "rowspan",
  "target", "rel", "width", "height",
]);

function safeUrl(v: string, attr: string): boolean {
  const s = v.trim().toLowerCase();
  if (!s) return true;
  if (s.startsWith("javascript:") || s.startsWith("data:text/html") || s.startsWith("vbscript:")) return false;
  if (attr === "href") {
    return (
      s.startsWith("http://") || s.startsWith("https://") ||
      s.startsWith("mailto:") || s.startsWith("#") || s.startsWith("/")
    );
  }
  return (
    s.startsWith("http://") || s.startsWith("https://") ||
    s.startsWith("blob:") || s.startsWith("/") ||
    (!s.includes(":") && !s.startsWith("//"))
  );
}

function cleanNode(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
  const remove: Node[] = [];
  const unwrap: Element[] = [];
  let n: Node | null = walker.currentNode;
  // kumpulkan dulu agar mutasi tak merusak traversal
  const els: Element[] = [];
  while (walker.nextNode()) {
    if (walker.currentNode.nodeType === 8) remove.push(walker.currentNode);
    else els.push(walker.currentNode as Element);
  }
  void n;
  for (const el of els) {
    const tag = el.tagName.toLowerCase();
    if (!TAGS.has(tag)) {
      if (["script", "style", "iframe", "object", "embed", "link", "meta"].includes(tag)) remove.push(el);
      else unwrap.push(el);
      continue;
    }
    for (const a of Array.from(el.attributes)) {
      const k = a.name.toLowerCase();
      if (k.startsWith("on") || k === "style" || !ATTRS.has(k)) {
        el.removeAttribute(a.name);
        continue;
      }
      if ((k === "href" || k === "src") && !safeUrl(a.value, k)) el.removeAttribute(a.name);
    }
  }
  for (const el of unwrap) {
    const parent = el.parentNode;
    if (!parent) continue;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }
  for (const r of remove) r.parentNode?.removeChild(r);
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  const doc = new DOMParser().parseFromString(dirty, "text/html");
  cleanNode(doc.body);
  return doc.body.innerHTML;
}
