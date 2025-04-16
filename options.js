// Save options to Chrome storage
function saveOptions() {
  const settings = {
    includeTitle: document.getElementById("include-title").checked,
    includeUrl: document.getElementById("include-url").checked,
    includeAuthor: document.getElementById("include-author").checked,
    includeDate: document.getElementById("include-date").checked,
  };

  chrome.storage.sync.set(settings, function () {
    // Show saved status
    const status = document.getElementById("status");
    status.classList.add("visible");

    setTimeout(function () {
      status.classList.remove("visible");
    }, 1500);
  });
}

// Load saved options from Chrome storage
function restoreOptions() {
  chrome.storage.sync.get(
    // Default values: title, url, and author enabled, date disabled
    {
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
    },
    function (items) {
      document.getElementById("include-title").checked = items.includeTitle;
      document.getElementById("include-url").checked = items.includeUrl;
      document.getElementById("include-author").checked = items.includeAuthor;
      document.getElementById("include-date").checked = items.includeDate;
    }
  );
}

// Initialize the options page
document.addEventListener("DOMContentLoaded", restoreOptions);

// Add change listeners to all checkboxes
document
  .getElementById("include-title")
  .addEventListener("change", saveOptions);
document.getElementById("include-url").addEventListener("change", saveOptions);
document
  .getElementById("include-author")
  .addEventListener("change", saveOptions);
document.getElementById("include-date").addEventListener("change", saveOptions);
