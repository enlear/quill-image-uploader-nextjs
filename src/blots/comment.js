import Quill from "quill";

const InlineBlot = Quill.import("blots/inline");

class CommentBlot extends InlineBlot {
  /**
   * @param {string} commentId The comment ID
   */
  static create(commentId) {
    const node = super.create();
    node.setAttribute("class", "ql-wg-comment-wrapper");
    if (commentId) {
      node.setAttribute("data-comment", commentId);
    }
    return node;
  }
}

CommentBlot.blotName = "commentBlot";
CommentBlot.tagName = "div";

Quill.register({ "formats/commentBlot": CommentBlot });

export default CommentBlot;
