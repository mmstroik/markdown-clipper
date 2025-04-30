# Markdown Clipper

Simple chromium extension that extracts the main content from any webpage and converts it to clean Markdown format. Removes ads, navigation, and other distracting elements to capture just the essential content. Includes YAML frontmatter with title, author, and date when available. Supports tables, code blocks, and task lists. Access via toolbar button or Alt+Shift+M shortcut.

Clone and build or download from the [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-clipper/diggniipmgdekjnkngjgodblmopocecc).

## Options

- **Parser Engine**: Choose between 'Readability' (default) and 'Defuddle' for extracting page content. Readability is generally recommended, but Defuddle might perform better on certain complex pages or those with non-standard article structures.
- **Metadata**: Control which frontmatter fields to include (title, URL, author, date)
- **Tab behavior**: Choose to open output in adjacent tab or at end of tab bar
- **Table formatting**: Preserve line breaks within table cells using HTML <br> tags
