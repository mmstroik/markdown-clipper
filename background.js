// Background script (service worker)
chrome.action.onClicked.addListener(async (tab) => {
  // Inject content scripts into the active tab
  if (tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["turndown-plugin-gfm.js", "contentScript.js"],
    });
  }
});

// Open options page when extension is installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  // Initialize default settings if this is a first install
  if (details.reason === "install") {
    chrome.storage.sync.set({
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
      preserveTableLinebreaks: false,
    });
  }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "markdownResult" && message.text) {
    // Escape basic HTML entities for safe embedding in <pre>
    const escapedText = message.text.replace(
      /[<>&]/g,
      (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c)
    );

    // Construct the HTML for the new tab
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <title>Clipped Markdown</title>
  <style>
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <pre>${escapedText}</pre>
</body>
</html>`;

    // Open a new tab with the generated HTML
    chrome.storage.sync.get({ openNextToCurrent: true }, function (settings) {
      chrome.tabs.create({
        url: "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent),
        index: settings.openNextToCurrent ? sender.tab.index + 1 : undefined,
      });
    });
  }
});
