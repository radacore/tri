import { Node, mergeAttributes } from "@tiptap/core";

// <figure><img ...><figcaption>caption ketik langsung</figcaption></figure>
// Caption benar-benar bisa diketik (node inline biasa), figure bisa di-drag.
export const Figure = Node.create({
  name: "figure",
  group: "block",
  draggable: true,
  content: "figureImage figureCaption",

  parseHTML() {
    return [{ tag: "figure" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes(HTMLAttributes), 0];
  },
});

export const FigureImage = Node.create({
  name: "figureImage",
  group: "figureImage",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "figure > img" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { class: "lp-figure-img" })];
  },
});

export const FigureCaption = Node.create({
  name: "figureCaption",
  group: "figureCaption",
  content: "inline*",

  parseHTML() {
    return [{ tag: "figcaption" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figcaption", mergeAttributes(HTMLAttributes), 0];
  },
});
