import Quill from "quill";

const InlineBlot = Quill.import("blots/inline");

const ATTRIBUTES = ["class", "data-comment"];

class CommentBlot extends InlineBlot {
  static create(value) {
    const node = super.create();
    node.setAttribute("class", value.class || "ql-wg-comment-wrapper");
    node.setAttribute("data-comment", value["data-comment"] || value.commentId);
    return node;
  }

  static formats(domNode) {
    return ATTRIBUTES.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }
}

CommentBlot.blotName = "commentBlot";
CommentBlot.tagName = "span";

Quill.register(CommentBlot);

export default CommentBlot;
