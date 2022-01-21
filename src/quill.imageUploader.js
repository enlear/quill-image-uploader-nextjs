import LoadingImage from "./blots/image.js";

class ImageUploader {
    constructor(quill, options) {
        this.quill = quill;
        this.options = options;
        this.range = null;

        if (typeof this.options.upload !== "function")
            console.warn(
                "[Missing config] upload function that returns a promise is required"
            );

        if (typeof this.options.newComment !== "function")
            console.warn(
                "[Missing config] newComment function that returns a promise is required"
            );

        if (typeof this.options.showComments !== "function")
            console.warn(
                "[Missing config] showComments function that returns a promise is required"
            );

        var toolbar = this.quill.getModule("toolbar");
        toolbar.addHandler("image", this.selectLocalImage.bind(this));
        toolbar.addHandler("code-block", this.fixHighlighter.bind(this));
        toolbar.addHandler("clean", this.clean.bind(this));
        toolbar.addHandler("underline", this.addComment.bind(this));

        this.handleDrop = this.handleDrop.bind(this);
        this.handlePaste = this.handlePaste.bind(this);

        this.quill.root.addEventListener("drop", this.handleDrop, false);
        this.quill.root.addEventListener("paste", this.handlePaste, false);

        this.renderComments.bind(this);
        const debouncedRenderComments = this.debounce((delta, oldDelta, source) => this.renderComments(delta, oldDelta, source), 2000);
        this.quill.on('text-change', debouncedRenderComments.bind(this));
    }

    addComment() {
        var range = this.quill.getSelection();

        if (range && range.length > 0 && this.options.newComment) {
            range.top = this.quill.getBounds(range.index, range.length).top
            this.options.newComment(range, this.quill);
        }
        this.quill.theme.tooltip.hide();
    }

    calculateIndexChange(delta) {
        var index = delta.ops[0].retain || 0;
        const change = delta.changeLength();
        return { index: index, change: change };
    }

    adjustIndex(currentIndex, indexDelta) {
        if (indexDelta.change > 0 && currentIndex < indexDelta.index) {
            // comment index is before the modified text and modification didn't shift content before its starting point
            return currentIndex;
        } else if (indexDelta.change < 0 && currentIndex < (indexDelta.index + indexDelta.change)) {
            // code shifted before its starting point but the comment index is before the modified text
            return currentIndex;
        } else {
            return currentIndex + indexDelta.change;
        }
    }

    renderComments(delta, oldDelta, source) {
        if (source === "user" && this.options.comments && Object.keys(this.options.comments()).length !== 0) {
            var indexDelta = this.calculateIndexChange(delta);
            var commentObjs = {};
            var topIncrement = 0;
            for (const [key, value] of Object.entries((this.options.comments(this.quill)))) {
                var newIndex = this.adjustIndex(value.range.index, indexDelta);
                var length = value.range.length;
                var top = this.quill.getBounds(newIndex, 0).top;
                if (newIndex >= this.quill.getLength()) {
                    top = this.quill.getBounds(this.quill.getLength(), 0).top + topIncrement;
                    topIncrement = topIncrement + 25;
                }
                if (newIndex > 0) {
                    commentObjs[key] = { range: { index: newIndex, length: length, top: top }, message: value.message };
                }
            }
            if (this.options.showComments) {
                this.options.showComments(commentObjs, this.quill);
            }
        }
    }

    debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    fixHighlighter() {
        const range = this.quill.getSelection(true);
        const formats = this.quill.getFormat(range);
        // if its not a code-block yet, turn it into one.
        if (!formats['code-block']) {
            return this.quill.formatLine(range.index, range.length, 'code-block', 'user');
        };

        // if it was a code-block, and the user meant to remove it
        this.quill.removeFormat(range.index, range.length, 'user');
        // running it twise to remove colors
        this.quill.removeFormat(range.index, range.length, 'user');
    }

    clean() {
        const range = this.quill.getSelection(true);
        const formats = this.quill.getFormat(range);
        // running it twise to remove colors
        this.quill.removeFormat(range.index, range.length, 'user');
        this.quill.removeFormat(range.index, range.length, 'user');
    }

    selectLocalImage() {
        this.range = this.quill.getSelection();
        this.fileHolder = document.createElement("input");
        this.fileHolder.setAttribute("type", "file");
        this.fileHolder.setAttribute("accept", "image/*");
        this.fileHolder.setAttribute("style", "visibility:hidden");

        this.fileHolder.onchange = this.fileChanged.bind(this);

        document.body.appendChild(this.fileHolder);

        this.fileHolder.click();

        window.requestAnimationFrame(() => {
            document.body.removeChild(this.fileHolder);
        });
    }

    handleDrop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        if (
            evt.dataTransfer &&
            evt.dataTransfer.files &&
            evt.dataTransfer.files.length
        ) {
            if (document.caretRangeFromPoint) {
                const selection = document.getSelection();
                const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
                if (selection && range) {
                    selection.setBaseAndExtent(
                        range.startContainer,
                        range.startOffset,
                        range.startContainer,
                        range.startOffset
                    );
                }
            } else {
                const selection = document.getSelection();
                const range = document.caretPositionFromPoint(evt.clientX, evt.clientY);
                if (selection && range) {
                    selection.setBaseAndExtent(
                        range.offsetNode,
                        range.offset,
                        range.offsetNode,
                        range.offset
                    );
                }
            }

            this.range = this.quill.getSelection();
            let file = evt.dataTransfer.files[0];

            setTimeout(() => {
                this.range = this.quill.getSelection();
                this.readAndUploadFile(file);
            }, 0);
        }
    }

    handlePaste(evt) {
        let clipboard = evt.clipboardData || window.clipboardData;

        // IE 11 is .files other browsers are .items
        if (clipboard && (clipboard.items || clipboard.files)) {
            let items = clipboard.items || clipboard.files;
            const IMAGE_MIME_REGEX = /^image\/(jpe?g|gif|png|svg|webp)$/i;

            for (let i = 0; i < items.length; i++) {
                if (IMAGE_MIME_REGEX.test(items[i].type)) {
                    let file = items[i].getAsFile ? items[i].getAsFile() : items[i];

                    if (file) {
                        this.range = this.quill.getSelection();
                        evt.preventDefault();
                        setTimeout(() => {
                            this.range = this.quill.getSelection();
                            this.readAndUploadFile(file);
                        }, 0);
                    }
                }
            }
        }
    }

    readAndUploadFile(file) {
        let isUploadReject = false;

        const fileReader = new FileReader();

        fileReader.addEventListener(
            "load",
            () => {
                if (!isUploadReject) {
                    let base64ImageSrc = fileReader.result;
                    this.insertBase64Image(base64ImageSrc);
                }
            },
            false
        );

        if (file) {
            fileReader.readAsDataURL(file);
        }

        this.options.upload(file).then(
            (imageUrl) => {
                this.insertToEditor(imageUrl);
            },
            (error) => {
                isUploadReject = true;
                this.removeBase64Image();
                console.warn(error);
            }
        );
    }

    fileChanged() {
        const file = this.fileHolder.files[0];
        this.readAndUploadFile(file);
    }

    insertBase64Image(url) {
        const range = this.range;
        this.quill.insertEmbed(
            range.index,
            LoadingImage.blotName,
            `${url}`,
            "user"
        );
    }

    insertToEditor(url) {
        const range = this.range;
        // Delete the placeholder image
        this.quill.deleteText(range.index, 3, "user");
        // Insert the server saved image
        this.quill.insertEmbed(range.index, "image", `${url}`, "user");

        range.index++;
        this.quill.setSelection(range, "user");
    }

    removeBase64Image() {
        const range = this.range;
        this.quill.deleteText(range.index, 3, "user");
    }
}

window.ImageUploader = ImageUploader;
export default ImageUploader;