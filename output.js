document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const viewType = params.get("viewType"); // "single" or "dual"
  const text1 = params.get("text1") || "";
  const text2 = params.get("text2"); // Only present for "dual"

  const mainContainer = document.getElementById("main-container");
  if (!mainContainer) {
    console.error("Main container not found in output.html");
    return;
  }

  // Basic HTML escaping function
  function escapeHTML(str) {
    if (!str) return "";
    return str.replace(
      /[<>&]/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
        }[c] || c)
    );
  }

  const escapedText1 = escapeHTML(text1);
  const escapedText2 = text2 ? escapeHTML(text2) : null;

  if (viewType === "single") {
    mainContainer.classList.add("single-view-container");
    mainContainer.innerHTML = `
      <button class="copy-btn" id="copyBtnSingle">Copy to Clipboard</button>
      <div class="content-wrapper">
        <pre id="content">${escapedText1}</pre>
      </div>
    `;
    // copyHelper.js is already included in output.html and will find these IDs
    // We rely on copyHelper.js to call setupCopyButtonListener internally
  } else if (viewType === "dual" && escapedText2 !== null) {
    document.body.style.overflow = "hidden"; // Prevent body scroll for dual view
    mainContainer.classList.add("dual-view-container");
    mainContainer.innerHTML = `
      <div class="column">
        <div class="column-header"><span class="column-title">Readability Engine</span></div>
        <button class="copy-btn" id="copyBtnReadability">Copy</button>
        <div class="content-wrapper"><pre id="readability-content">${escapedText1}</pre></div>
      </div>
      <div class="column">
        <div class="column-header"><span class="column-title">Defuddle Engine</span></div>
        <button class="copy-btn" id="copyBtnDefuddle">Copy</button>
        <div class="content-wrapper"><pre id="defuddle-content">${escapedText2}</pre></div>
      </div>
    `;
    // copyHelper.js is already included in output.html and will find these IDs
  } else {
    mainContainer.innerHTML =
      "<p>Error: Invalid view type or missing content.</p>";
    console.error("Invalid view type or missing content for output page.");
  }

  // Initialize copy listeners - copyHelper.js should handle this itself
  // as it's included in the HTML and runs after the DOM is built by this script.
  // If copyHelper.js was more modular, we might call an init function here.
});
