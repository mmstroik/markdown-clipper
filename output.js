document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const viewType = params.get("viewType"); // "single" or "dual"
  const text1 = params.get("text1") || "";
  const text2 = params.get("text2"); // Only present for "dual"

  if (text1.trim() === "") {
    console.warn("Warning: Primary text content (text1) is empty");
  }
  if (viewType === "dual" && (!text2 || text2.trim() === "")) {
    console.warn(
      "Warning: Secondary text content (text2) is empty for dual view"
    );
  }

  const mainContainer = document.getElementById("main-container");
  if (!mainContainer) {
    console.error("Main container not found in output.html");
    return;
  }

  function escapeHTML(str) {
    if (!str) return "";
    return str.replace(
      /[<>&"'`]/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&#39;",
          "`": "&#96;",
        }[c] || c)
    );
  }

  const escapedText1 = escapeHTML(text1);
  const escapedText2 = text2 ? escapeHTML(text2) : "";

  if (viewType === "single") {
    mainContainer.classList.add("single-view-container");
    mainContainer.innerHTML = `
      <button class="copy-btn" id="copyBtnSingle" aria-label="Copy content to clipboard">Copy to Clipboard</button>
      <div class="content-wrapper">
        <pre id="content">${escapedText1}</pre>
      </div>
    `;
  } else if (viewType === "dual") {
    document.body.style.overflow = "hidden"; // Prevent body scroll for dual view
    mainContainer.classList.add("dual-view-container");
    mainContainer.innerHTML = `
      <div class="column">
        <div class="column-header" role="heading" aria-level="2"><span class="column-title">Readability Extraction Engine</span></div>
        <button class="copy-btn" id="copyBtnReadability" aria-label="Copy Readability output to clipboard">Copy</button>
        <div class="content-wrapper"><pre id="readability-content">${escapedText1}</pre></div>
      </div>
      <div class="column">
        <div class="column-header" role="heading" aria-level="2"><span class="column-title">Defuddle Extraction Engine</span></div>
        <button class="copy-btn" id="copyBtnDefuddle" aria-label="Copy Defuddle output to clipboard">Copy</button>
        <div class="content-wrapper"><pre id="defuddle-content">${escapedText2}</pre></div>
      </div>
    `;
  } else {
    mainContainer.innerHTML = `
      <p>Error: Invalid parameters. The page requires a valid 'viewType' ('single' or 'dual') and content parameters.</p>
      <p>Please use this page through the extension's normal workflow rather than accessing it directly.</p>
    `;
    console.error(
      "Invalid view type or missing/empty content for output page. ViewType:",
      viewType
    );
  }
});
