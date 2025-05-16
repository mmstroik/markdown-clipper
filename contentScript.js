// Main content script: extracts content and converts to Markdown
import TurndownService from "turndown";
import { Readability } from "@mozilla/readability";
import Defuddle from "defuddle"; // Import Defuddle as well

// Function to pre-process CodeTabs for Defuddle
function preprocessCodeTabsForDefuddle() {
  console.log("Pre-processing CodeTabs for Defuddle");
  const transformedContainers = []; // Keep track of added containers for cleanup

  // Find all CodeTabs elements
  const codeTabElements = document.querySelectorAll(
    ".CodeTabs:not(.md-clipper-processed)"
  ); // Avoid re-processing
  if (codeTabElements.length === 0) {
    console.log("No new CodeTabs elements found to transform for Defuddle.");
    return transformedContainers; // Return empty array if nothing to clean up
  }

  console.log(
    `Found ${codeTabElements.length} CodeTabs elements to transform for Defuddle`
  );

  // Process each CodeTabs element
  codeTabElements.forEach((codeTab) => {
    // Create a container to hold transformed code blocks
    const codeBlocksContainer = document.createElement("div");
    codeBlocksContainer.className =
      "transformed-code-blocks md-clipper-temporary"; // Add cleanup marker
    transformedContainers.push(codeBlocksContainer); // Track for removal

    // Find all code elements within the tabs
    const codeElements = codeTab.querySelectorAll("code[data-lang]");

    if (codeElements.length > 0) {
      codeElements.forEach((codeEl) => {
        const language = codeEl.getAttribute("data-lang") || "";
        const tabName = codeEl.getAttribute("name") || "";
        const codeText = codeEl.textContent || "";

        // Create a standard pre+code structure that Defuddle will recognize
        const preElement = document.createElement("pre");
        const codeElement = document.createElement("code");

        // Apply language class in a format Defuddle will recognize
        codeElement.className = `language-${language.toLowerCase()}`;
        if (tabName) {
          codeElement.setAttribute("data-tab-name", tabName);
        }

        // Set the code content
        codeElement.textContent = codeText;

        // Add a header comment if there's a tab name
        if (tabName) {
          const headerDiv = document.createElement("div");
          headerDiv.className = "code-tab-header";
          headerDiv.textContent = `// ${tabName}`;
          codeBlocksContainer.appendChild(headerDiv);
        }

        // Assemble the code block
        preElement.appendChild(codeElement);
        codeBlocksContainer.appendChild(preElement);
      });

      // Insert the transformed code blocks immediately after the original CodeTabs
      codeTab.parentNode.insertBefore(codeBlocksContainer, codeTab.nextSibling);

      // Mark the original as processed
      codeTab.classList.add("md-clipper-processed");
    }
  });

  console.log("Finished transforming CodeTabs elements for Defuddle.");
  return transformedContainers; // Return containers for cleanup
}

// Function to clean up temporary elements added by pre-processing
function cleanupTemporaryElements(elements) {
  if (elements && elements.length > 0) {
    console.log(`Cleaning up ${elements.length} temporary DOM elements.`);
    elements.forEach((el) => {
      el.parentNode.removeChild(el);
    });
  } else {
    console.log("No temporary elements to clean up.");
  }
}

// Function to parse content using Readability
async function parseWithReadability() {
  console.log("Using Readability parser.");

  // Clone the document for Readability
  const documentClone = document.cloneNode(true);

  // Run Readability
  console.log("Initializing Readability parser");
  const reader = new Readability(documentClone);
  const result = reader.parse();
  console.log("Readability parse result:", {
    hasContent: !!result.content,
    contentLength: result.content?.length,
    title: result.title,
    author: result.byline, // Readability uses 'byline'
    date: result.siteName, // Readability uses 'siteName' (no reliable date)
  });

  return result;
}

// Function to parse content using Defuddle
async function parseWithDefuddle() {
  console.log("Using Defuddle parser.");

  // Pre-process CodeTabs specifically for Defuddle
  const temporaryElements = preprocessCodeTabsForDefuddle();

  try {
    // Run Defuddle
    console.log("Initializing Defuddle parser");
    let defuddle = new Defuddle(document, { url: document.URL });
    const result = defuddle.parse();
    console.log("Defuddle parse result:", {
      hasContent: !!result.content,
      contentLength: result.content?.length,
      title: result.title,
      author: result.author,
      date: result.published, // Defuddle uses 'published'
    });

    // Map Defuddle result fields to common structure
    result.byline = result.author; // Map author to byline
    result.siteName = result.published; // Use published date as siteName equivalent (for consistency)

    return result;
  } finally {
    // Clean up temporary DOM elements
    cleanupTemporaryElements(temporaryElements);
  }
}

// Function to convert HTML content to Markdown
function convertToMarkdown(
  contentHtml,
  settings,
  titleText,
  authorText,
  dateText,
  urlText
) {
  // Initialize Turndown (Markdown converter)
  console.log("Initializing Turndown service");
  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full",
    preformattedCode: false, // we'll handle pre tags via plugin rules
  });

  // Apply GFM plugin rules (tables, task lists, code blocks)
  // Ensure all plugin functions are available on window before attempting to use them
  if (
    typeof window.highlightedCodeBlock === "function" &&
    typeof window.tables === "function" &&
    typeof window.taskListItems === "function"
  ) {
    // Wrapper for the tables plugin to pass settings
    const tablesPluginWithSettings = (service) => {
      window.tables(service, settings); // Pass settings to the tables plugin
    };

    turndownService.use([
      window.highlightedCodeBlock, // Assumes this doesn't need settings
      tablesPluginWithSettings,
      window.taskListItems, // Assumes this doesn't need settings
    ]);
    console.log("Applied GFM plugins (tables with settings).");
  } else {
    console.warn(
      "GFM plugins (highlightedCodeBlock, tables, or taskListItems) not fully available on window. Some GFM features might be missing."
    );
  }

  // Remove any script/style elements content (just in case)
  turndownService.remove(["script", "style"]);

  // Convert extracted HTML to Markdown text
  let markdownBody = "";
  try {
    markdownBody = turndownService.turndown(contentHtml);
    console.log("Markdown conversion complete", {
      markdownLength: markdownBody.length,
      firstChars: markdownBody.substring(0, 100),
    });
  } catch (err) {
    console.error("Turndown conversion error:", err);
    markdownBody = ""; // fallback to empty
  }

  // Prepare final markdown with optional frontmatter
  let fullMarkdown = "";
  const hasMetadata =
    settings.includeTitle ||
    settings.includeUrl ||
    settings.includeAuthor ||
    settings.includeDate;

  if (hasMetadata) {
    function escapeYaml(str) {
      // Basic escaping, might need refinement
      return str ? str.replace(/\n/g, " ").replace(/"/g, '\\"') : ""; // Corrected quote escaping
    }

    fullMarkdown += "---\n";
    if (settings.includeTitle && titleText) {
      fullMarkdown += `title: "${escapeYaml(titleText)}"\n`;
    }
    if (settings.includeUrl && urlText) {
      fullMarkdown += `url: "${escapeYaml(urlText)}"\n`;
    }
    if (settings.includeAuthor && authorText) {
      fullMarkdown += `author: "${escapeYaml(authorText)}"\n`;
    }
    if (settings.includeDate && dateText) {
      fullMarkdown += `date: "${escapeYaml(dateText)}"\n`;
    }
    fullMarkdown += "---\n\n";
  }

  // Add the main body
  fullMarkdown += markdownBody;

  return fullMarkdown;
}

(async function () {
  console.log("Content script started");

  // Check required libraries are loaded
  if (
    typeof Readability === "undefined" ||
    typeof TurndownService === "undefined" ||
    typeof Defuddle === "undefined"
  ) {
    console.error("Required libraries not loaded:", {
      readability: typeof Readability,
      turndown: typeof TurndownService,
      defuddle: typeof Defuddle,
    });
    return;
  }

  // Get user preferences first (including parser choice)
  chrome.storage.sync.get(
    {
      parserChoice: "readability", // Default parser
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
      preserveTableLinebreaks: false,
    },
    async function (settings) {
      console.log("User settings:", settings);

      try {
        let readabilityResult, defuddleResult, result;
        let markdownContent;

        if (settings.parserChoice === "both") {
          // --- Run both parsers ---
          readabilityResult = await parseWithReadability();
          defuddleResult = await parseWithDefuddle();

          // Convert both results to markdown
          const readabilityMarkdown = convertToMarkdown(
            readabilityResult.content || "",
            settings,
            readabilityResult.title || document.title || "",
            readabilityResult.byline || "",
            readabilityResult.siteName || "",
            document.URL
          );

          const defuddleMarkdown = convertToMarkdown(
            defuddleResult.content || "",
            settings,
            defuddleResult.title || document.title || "",
            defuddleResult.byline || "",
            defuddleResult.siteName || "",
            document.URL
          );

          // Send both markdown contents to the background script
          chrome.runtime.sendMessage({
            type: "bothEnginesResult",
            readabilityText: readabilityMarkdown,
            defuddleText: defuddleMarkdown,
          });
          return;
        } else if (settings.parserChoice === "defuddle") {
          // --- Defuddle Path ---
          defuddleResult = await parseWithDefuddle();
          result = defuddleResult;
        } else {
          // --- Readability Path (Default) ---
          readabilityResult = await parseWithReadability();
          result = readabilityResult;
        }

        // --- Common Processing Logic ---
        markdownContent = convertToMarkdown(
          result.content || "",
          settings,
          result.title || document.title || "",
          result.byline || "",
          result.siteName || "",
          document.URL
        );

        // Send the Markdown to the background script
        chrome.runtime.sendMessage({
          type: "markdownResult",
          text: markdownContent,
        });
      } catch (err) {
        console.error(`Error during ${settings.parserChoice} parsing:`, err);
      }
    }
  );
})();
