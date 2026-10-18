# Digital garden

The garden is a graph of independently authored HTML fragments.

## Add a page

1. Create any `.html` file under `pages/`. The filename does not become the page identity.
2. Add an entry to [`garden.json`](./garden.json):

   ```json
   {
     "id": "stable-page-id",
     "parentId": "existing-parent-id",
     "title": "Readable title",
     "file": "pages/whatever-you-want.html",
     "summary": "A short description.",
     "tags": ["topic"]
   }
   ```

3. Make the file an HTML fragment with matching metadata:

   ```html
   <article data-garden-id="stable-page-id" data-parent-id="existing-parent-id">
     <p>Any normal HTML content can go here.</p>
   </article>
   ```

The shell loads the fragment, validates its `id` and `parentId`, and renders it beside the tree and relationship graph. Use `data-garden-link="stable-page-id"` on links between garden pages. Images, video, audio, PDF objects, tables, details blocks, inline layouts, and other static HTML are supported inside a page. Content scripts are intentionally not executed when fragments are loaded.

The public page is [`/digital-garden/`](./index.html). The manifest and shell are separate from page content so adding notes does not require duplicating navigation markup.
