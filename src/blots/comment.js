import Quill from "quill";

const InlineBlot = Quill.import("blots/inline");

class CommentBlot extends InlineBlot {
  /**
   *
   * @param {{commentId:string}} value Object of commentId of the comment
   * @returns
   */
  static create(value) {
    const node = super.create();
    node.setAttribute("class", "ql-wg-comment-wrapper");
    node.setAttribute("data-comment", value.commentId);
    return node;
  }
}

CommentBlot.blotName = "CommentBlot";
CommentBlot.tagName = "div";

Quill.register(CommentBlot);

export default CommentBlot;
