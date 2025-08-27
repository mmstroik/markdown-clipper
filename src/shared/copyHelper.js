function setupCopyButtonListener(buttonId, contentId) {
  const button = document.getElementById(buttonId);
  const contentElement = document.getElementById(contentId);
  console.log(
    `Copy helper: Attempting to set up button '${buttonId}' for content '${contentId}'`
  );

  if (!button) {
    console.warn(`Copy helper: Button with ID '${buttonId}' not found.`);
    return false;
  }
  if (!contentElement) {
    console.warn(
      `Copy helper: Content element with ID '${contentId}' not found.`
    );
    return false;
  }
  console.log(
    `Copy helper: Found button '${buttonId}' and content '${contentId}'`
  );

  button.addEventListener("click", async () => {
    const textToCopy = contentElement.textContent;

    if (!textToCopy || textToCopy.trim() === "") {
      console.warn("Copy helper: Nothing to copy - content is empty");
      alert("There's no content to copy.");
      return;
    }

    console.log(
      "Copy helper: Button clicked. Attempting to copy directly. Text length:",
      textToCopy.length
    );
    try {
      await navigator.clipboard.writeText(textToCopy);
      console.log("Copy helper: Text copied to clipboard successfully!");
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.setAttribute("aria-live", "polite");
      setTimeout(() => {
        button.textContent = originalText;
        button.removeAttribute("aria-live");
      }, 2000);
    } catch (err) {
      console.error("Copy helper: Failed to copy text directly:", err);
      alert(
        "Failed to copy to clipboard. This might be due to permission issues or browser settings. " +
          "Try selecting the content manually and using Ctrl+C/Cmd+C instead."
      );
    }
  });
  console.log(`Copy helper: Event listener added for button '${buttonId}'`);
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Copy helper: DOMContentLoaded event fired.");

  const buttonsToSetup = [
    { buttonId: "copyBtnSingle", contentId: "content" },
    { buttonId: "copyBtnReadability", contentId: "readability-content" },
    { buttonId: "copyBtnDefuddle", contentId: "defuddle-content" },
  ];

  let setupCount = 0;
  buttonsToSetup.forEach(({ buttonId, contentId }) => {
    if (
      document.getElementById(buttonId) &&
      document.getElementById(contentId)
    ) {
      console.log(
        `Copy helper: Attempting to set up ${buttonId} for ${contentId}`
      );
      if (setupCopyButtonListener(buttonId, contentId)) {
        setupCount++;
      }
    } else {
    }
  });

  if (setupCount === 0) {
    console.warn(
      "Copy helper: No copy buttons were successfully set up. This might be normal if the view type does not include copyable content or if HTML IDs are mismatched."
    );
  } else {
    console.log(
      `Copy helper: Successfully set up ${setupCount} copy button(s).`
    );
  }
});

console.log("Copy helper: Script loaded.");
