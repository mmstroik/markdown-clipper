// Main content script: extracts content and converts to Markdown
import TurndownService from "turndown";
import Defuddle from "defuddle";

(async function () {
  // Only proceed if Defuddle and Turndown are loaded
  if (
    typeof Defuddle === "undefined" ||
    typeof TurndownService === "undefined"
  ) {
    return;
  }

  // Run Defuddle to extract main content and metadata
  let defuddle = new Defuddle(document, { url: document.URL });
  let result;
  try {
    result = defuddle.parse();
  } catch (err) {
    console.error("Defuddle parse error:", err);
    return;
  }

  // Get extracted HTML content and metadata
  const contentHtml = result.content || ""; // main content (HTML)
  const titleText = result.title || document.title || "";
  const authorText = result.author || "";
  const dateText = result.published || "";
  const urlText = document.URL;

  // Initialize Turndown (Markdown converter)
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
  if (typeof highlightedCodeBlock === "function") {
    turndownService.use([highlightedCodeBlock, tables, taskListItems]);
  }

  // Remove any script/style elements content (just in case)
  turndownService.remove(["script", "style"]);

  // Convert extracted HTML to Markdown text
  let markdownBody = "";
  try {
    markdownBody = turndownService.turndown(contentHtml);
  } catch (err) {
    console.error("Turndown conversion error:", err);
    markdownBody = ""; // fallback to empty
  }

  // Get user preferences
  chrome.storage.sync.get(
    {
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
    },
    function (settings) {
      let fullMarkdown = "";

      // Check if any metadata fields are enabled
      const hasMetadata =
        settings.includeTitle ||
        settings.includeUrl ||
        settings.includeAuthor ||
        settings.includeDate;

      if (hasMetadata) {
        // Prepare YAML frontmatter
        function escapeYaml(str) {
          return str.replace(/\n/g, " ").replace(/"/g, '\\"');
        }
        let frontmatter = "---\n";
        if (settings.includeTitle && titleText) {
          frontmatter += `title: "${escapeYaml(titleText)}"\n`;
        }
        if (settings.includeUrl && urlText) {
          frontmatter += `url: "${escapeYaml(urlText)}"\n`;
        }
        if (settings.includeAuthor && authorText) {
          frontmatter += `author: "${escapeYaml(authorText)}"\n`;
        }
        if (settings.includeDate && dateText) {
          frontmatter += `date: "${escapeYaml(dateText)}"\n`;
        }
        frontmatter += "---\n\n";

        fullMarkdown = frontmatter + markdownBody;
      } else {
        fullMarkdown = markdownBody;
      }

      // Send the markdown result back to the background script
      chrome.runtime.sendMessage({
        type: "markdownResult",
        text: fullMarkdown,
      });
    }
  );
})();
