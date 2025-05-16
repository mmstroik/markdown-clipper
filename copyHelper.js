// copyHelper.js - Used in output.html to handle copy functionality

function setupCopyButtonListener(buttonId, contentId) {
  const button = document.getElementById(buttonId);
  const contentElement = document.getElementById(contentId);
  console.log(
    `Copy helper: Attempting to set up button '${buttonId}' for content '${contentId}'`
  );

  if (!button) {
    console.warn(`Copy helper: Button with ID '${buttonId}' not found.`);
    return;
  }
  if (!contentElement) {
    console.warn(
      `Copy helper: Content element with ID '${contentId}' not found.`
    );
    return;
  }
  console.log(
    `Copy helper: Found button '${buttonId}' and content '${contentId}'`
  );

  button.addEventListener("click", async () => {
    const textToCopy = contentElement.textContent;
    console.log(
      "Copy helper: Button clicked. Attempting to copy directly. Text length:",
      textToCopy.length
    );
    try {
      await navigator.clipboard.writeText(textToCopy);
      console.log("Copy helper: Text copied to clipboard successfully!");
      const originalText = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error("Copy helper: Failed to copy text directly:", err);
      alert(`Failed to copy: ${err.message}. Check console for more details.`);
    }
  });
  console.log(`Copy helper: Event listener added for button '${buttonId}'`);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Copy helper: DOMContentLoaded event fired.");
  // Logic to initialize listeners based on the view
  // Check for single view content ID first
  if (document.getElementById("content")) {
    console.log("Copy helper: Initializing for single view");
    setupCopyButtonListener("copyBtnSingle", "content");
  }
  // Then check for dual view content IDs
  else if (
    document.getElementById("readability-content") &&
    document.getElementById("defuddle-content")
  ) {
    console.log("Copy helper: Initializing for dual view");
    setupCopyButtonListener("copyBtnReadability", "readability-content");
    setupCopyButtonListener("copyBtnDefuddle", "defuddle-content");
  } else {
    console.warn(
      "Copy helper: Could not determine view type (single/dual) or content elements are missing after DOMContentLoaded."
    );
  }
});

console.log("Copy helper: Script loaded.");
