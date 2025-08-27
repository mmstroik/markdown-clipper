const browser = typeof chrome !== 'undefined' ? chrome : window.browser;

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
    removeImages: document.getElementById("remove-images").checked,
    openNextToCurrent: document.getElementById("open-next-to-current").checked,
    preserveTableLinebreaks: document.getElementById(
      "preserve-table-linebreaks"
    ).checked,
  };

  browser.storage.sync.set(settings, function () {
    // Show saved status
    const status = document.getElementById("status");
    status.classList.add("visible");

    setTimeout(function () {
      status.classList.remove("visible");
    }, 1500);
  });
}

function restoreOptions() {
  browser.storage.sync.get(
    {
      parserChoice: "readability",
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
      removeImages: false,
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
        document.getElementById("parser-readability").checked = true;
      }

      document.getElementById("include-title").checked = items.includeTitle;
      document.getElementById("include-url").checked = items.includeUrl;
      document.getElementById("include-author").checked = items.includeAuthor;
      document.getElementById("include-date").checked = items.includeDate;
      document.getElementById("remove-images").checked = items.removeImages;
      document.getElementById("open-next-to-current").checked =
        items.openNextToCurrent;
      document.getElementById("preserve-table-linebreaks").checked =
        items.preserveTableLinebreaks;
    }
  );
}

document.addEventListener("DOMContentLoaded", restoreOptions);

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
document.getElementById("remove-images").addEventListener("change", saveOptions);
document
  .getElementById("open-next-to-current")
  .addEventListener("change", saveOptions);
document
  .getElementById("preserve-table-linebreaks")
  .addEventListener("change", saveOptions);
