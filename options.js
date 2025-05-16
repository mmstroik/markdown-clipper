// Save options to Chrome storage
function saveOptions() {
  const parserChoice = document.querySelector(
    'input[name="parser"]:checked'
  ).value;
  const settings = {
    parserChoice: parserChoice,
    includeTitle: document.getElementById("include-title").checked,
    includeUrl: document.getElementById("include-url").checked,
    includeAuthor: document.getElementById("include-author").checked,
    includeDate: document.getElementById("include-date").checked,
    openNextToCurrent: document.getElementById("open-next-to-current").checked,
    preserveTableLinebreaks: document.getElementById(
      "preserve-table-linebreaks"
    ).checked,
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
    // Default values
    {
      parserChoice: "readability", // Default to Readability
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
      openNextToCurrent: true,
      preserveTableLinebreaks: false,
    },
    function (items) {
      // Set the correct radio button
      if (items.parserChoice === "defuddle") {
        document.getElementById("parser-defuddle").checked = true;
      } else if (items.parserChoice === "both") {
        document.getElementById("parser-both").checked = true;
      } else {
        document.getElementById("parser-readability").checked = true; // Default case
      }

      document.getElementById("include-title").checked = items.includeTitle;
      document.getElementById("include-url").checked = items.includeUrl;
      document.getElementById("include-author").checked = items.includeAuthor;
      document.getElementById("include-date").checked = items.includeDate;
      document.getElementById("open-next-to-current").checked =
        items.openNextToCurrent;
      document.getElementById("preserve-table-linebreaks").checked =
        items.preserveTableLinebreaks;
    }
  );
}

// Initialize the options page
document.addEventListener("DOMContentLoaded", restoreOptions);

// Add change listeners to all checkboxes and radio buttons
document.querySelectorAll('input[name="parser"]').forEach((radio) => {
  radio.addEventListener("change", saveOptions);
});
document
  .getElementById("include-title")
  .addEventListener("change", saveOptions);
document.getElementById("include-url").addEventListener("change", saveOptions);
document
  .getElementById("include-author")
  .addEventListener("change", saveOptions);
document.getElementById("include-date").addEventListener("change", saveOptions);
document
  .getElementById("open-next-to-current")
  .addEventListener("change", saveOptions);
document
  .getElementById("preserve-table-linebreaks")
  .addEventListener("change", saveOptions);
