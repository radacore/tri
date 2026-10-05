import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image as ImageExt } from "@tiptap/extension-image";
import { Link as LinkExt } from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, List, ListOrdered, Quote, Link as LinkIcon,
  ImagePlus, Undo2, Redo2, Eraser, Loader2,
} from "lucide-react";
import { uploadFile } from "../api/client";
import { Figure, FigureImage, FigureCaption } from "./figureNodes";

function insertFigure(editor: any, src: string) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "figure",
      content: [
        { type: "figureImage", attrs: { src, alt: "" } },
        { type: "figureCaption", content: [{ type: "text", text: "Write a caption here…" }] },
      ],
    })
    .run();
}

export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      Figure,
      FigureImage,
      FigureCaption,
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      ImageExt.configure({ inline: false }),
      LinkExt.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "tiptap" },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length === 0) return false;
        event.preventDefault();
        const ed = editorRef.current;
        if (!ed) return true;
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        void (async () => {
          setUploading(true);
          try {
            if (coords) ed.chain().setTextSelection(coords.pos).run();
            for (const f of files) {
              const r = await uploadFile(f);
              insertFigure(ed, r.url);
            }
          } finally {
            setUploading(false);
          }
        })();
        return true;
      },
    },
    onUpdate({ editor }) {
      onChangeRef.current(editor.getHTML());
    },
  });

  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Sinkron bila value diganti dari luar (buka artikel lain)
  const initial = useRef(value);
  useEffect(() => {
    if (editor && value !== initial.current && value !== editor.getHTML()) {
      initial.current = value;
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  if (!editor) return null;

  const pick = () => fileRef.current?.click();
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setUploading(true);
    try {
      const r = await uploadFile(f);
      insertFigure(editor, r.url);
    } finally {
      setUploading(false);
    }
  };

  const btn = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-lg transition ${
      active ? "bg-brand text-white" : "text-ink-secondary hover:bg-surface-hover hover:text-ink-primary"
    }`;

  const setLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Link URL:", prev || "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e2eceb]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e2eceb] bg-surface-muted p-1.5">
        <button type="button" className={btn(editor.isActive("bold"))} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("italic"))} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("underline"))} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("strike"))} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-[#e2eceb]" />
        <button type="button" className={btn(editor.isActive("heading", { level: 1 }))} title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("bulletList"))} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("orderedList"))} title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={btn(editor.isActive("blockquote"))} title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-[#e2eceb]" />
        <button type="button" className={btn(editor.isActive("link"))} title="Link" onClick={setLink}><LinkIcon className="h-4 w-4" /></button>
        <button type="button" className={btn(false)} title="Insert image" onClick={pick} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
        <span className="mx-1 h-5 w-px bg-[#e2eceb]" />
        <button type="button" className={btn(false)} title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></button>
        <button type="button" className={btn(false)} title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></button>
        <button type="button" className={btn(false)} title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><Eraser className="h-4 w-4" /></button>
        <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden"
          onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <EditorContent editor={editor} className="min-h-[220px] max-h-[520px] overflow-y-auto p-4" />
      <p className="border-t border-[#e2eceb] bg-surface-muted px-4 py-1.5 text-xs text-ink-muted">
        Drag &amp; drop images here to auto-upload — click a caption below an image to edit it.
      </p>
    </div>
  );
}
