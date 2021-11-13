# Quill ImageHandler Module for NextJS

A modifed alternative of [Quill Image Upload Plugin](https://github.com/noeloconnell/quill-image-uploader) to support NextJS

The original plugin uses css import in node_modules, which is not supported by the latest NextJS.

## Credits
The full credit for the editor plugin goes to [Quill Image Upload Plugin](https://github.com/noeloconnell/quill-image-uploader) and this is a modificaion to support the NextJS.

Therefore, keep upto date on its issue tracker whether the issue is fixed.

### Install

Install with npm:

```bash
npm install @writergate/quill-image-uploader-nextjs --save
```

### Webpack/ES6

```javascript
import Quill from "quill";
import ImageUploader from "quill.imageUploader.js";
import '@writergate/quill-image-uploader-nextjs/dist/quill.imageUploader.min.css';

Quill.register("modules/imageUploader", ImageUploader);

const quill = new Quill(editor, {
  // ...
  modules: {
    // ...
    imageUploader: {
      upload: (file) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(
              "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/480px-JavaScript-logo.png"
            );
          }, 3500);
        });
      },
    },
  },
});
```
**Note**: It's also important that you create a quill component and dynamically import the component with SSR: false for NextJS.

e.g: No SSR Editor component includes all the above code.

```javascript

const QuillNoSSR = dynamic(
  () => import('src/components/no-ssr-editor').then(md => md.default),
  { ssr: false }
);

```