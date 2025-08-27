# Build Instructions for Markdown Clipper

This extension now supports both Chrome and Firefox browsers.

## Prerequisites

- Node.js and npm installed
- pnpm package manager (`npm install -g pnpm`)

## Installation

```bash
pnpm install
```

## Development

### Chrome
```bash
npm run dev:chrome
```
This will watch for changes and rebuild automatically. The built extension will be in `dist-chrome/`.

### Firefox
```bash
npm run dev:firefox
```
This will watch for changes and rebuild automatically. The built extension will be in `dist-firefox/`.

## Production Build

### Build for Chrome only
```bash
npm run build:chrome
```
Creates a production build in `dist-chrome/` and a zip file in `builds/`.

### Build for Firefox only
```bash
npm run build:firefox
```
Creates a production build in `dist-firefox/` and a zip file in `builds/`.

### Build for both browsers
```bash
npm run build:all
# or simply
npm run build
```
Creates production builds for both browsers.

## Loading the Extension

### Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist-chrome` directory

### Firefox
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Navigate to `dist-firefox` and select the `manifest.json` file

## Project Structure

```
markdown-clipper/
├── src/
│   ├── shared/        # Code shared between browsers
│   │   ├── contentScript.js
│   │   ├── background.js
│   │   ├── options.js
│   │   ├── options.html
│   │   ├── output.js
│   │   ├── output.html
│   │   ├── output.css
│   │   ├── copyHelper.js
│   │   ├── turndown-gfm.js
│   │   └── icons/
│   ├── chrome/        # Chrome-specific files
│   │   └── manifest.json
│   └── firefox/       # Firefox-specific files
│       ├── manifest.json
│       └── background.js
├── dist-chrome/       # Chrome build output
├── dist-firefox/      # Firefox build output
└── builds/           # Zip files for distribution
```

## Browser Compatibility

- **Chrome**: Uses Manifest V3
- **Firefox**: Uses Manifest V2 (with polyfill for browser API compatibility)

## API Differences Handled

The extension handles the following API differences between Chrome and Firefox:
- `chrome` vs `browser` namespace (uses runtime detection)
- Manifest version differences (V3 for Chrome, V2 for Firefox)
- Script injection methods (scripting API for Chrome, tabs.executeScript for Firefox)
- Extension action naming (action vs browserAction)