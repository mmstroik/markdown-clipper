// Background script (service worker)
chrome.action.onClicked.addListener(async (tab) => {
  // Inject content scripts into the active tab
  if (tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["turndown-gfm.js", "contentScript.js"],
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

// Listen for messages from the content script or data: URL tabs
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "markdownResult" && message.text) {
    const outputPageUrl = chrome.runtime.getURL("output.html");
    const params = new URLSearchParams();
    params.append("viewType", "single");
    params.append("text1", message.text); // Raw text, output.js will escape it

    const fullUrl = `${outputPageUrl}?${params.toString()}`;

    chrome.storage.sync.get({ openNextToCurrent: true }, function (settings) {
      chrome.tabs.create({
        url: fullUrl,
        index:
          settings.openNextToCurrent && sender.tab
            ? sender.tab.index + 1
            : undefined,
      });
    });
  } else if (
    message.type === "bothEnginesResult" &&
    message.readabilityText &&
    message.defuddleText
  ) {
    const outputPageUrl = chrome.runtime.getURL("output.html");
    const params = new URLSearchParams();
    params.append("viewType", "dual");
    params.append("text1", message.readabilityText); // Raw text
    params.append("text2", message.defuddleText); // Raw text

    const fullUrl = `${outputPageUrl}?${params.toString()}`;

    chrome.storage.sync.get({ openNextToCurrent: true }, function (settings) {
      chrome.tabs.create({
        url: fullUrl,
        index:
          settings.openNextToCurrent && sender.tab
            ? sender.tab.index + 1
            : undefined,
      });
    });
  }
});
