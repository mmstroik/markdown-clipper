# Markdown Clipper

Simple chromium extension that extracts the main content from any webpage and converts it to clean Markdown format. Removes ads, navigation, and other distracting elements to capture just the essential content. Includes YAML frontmatter with title, author, and date when available. Supports tables, code blocks, and task lists. Access via toolbar icon or Alt+Shift+M shortcut.

Clone and build or download from the [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-clipper/diggniipmgdekjnkngjgodblmopocecc).

## Options

- **Parser Engine**: Choose between 'Readability' (default), 'Defuddle', or 'Both'. Readability aims for minimal clutter. Defuddle removes fewer uncertain elements and can extract more metadata. 'Both' option lets you compare results from both engines side-by-side.
- **Clipboard Integration**: Button to copy the generated Markdown to your clipboard.
- **Metadata**: Control which frontmatter fields to include (title, URL, author, date)
- **Tab behavior**: Choose to open output in adjacent tab or at end of tab bar
- **Table formatting**: Preserve line breaks within table cells using HTML <br> tags
