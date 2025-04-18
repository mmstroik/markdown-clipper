// Main content script: extracts content and converts to Markdown
import TurndownService from "turndown";
import Defuddle from "defuddle";

(async function () {
  console.log("Content script started");

  // Only proceed if Defuddle and Turndown are loaded
  if (
    typeof Defuddle === "undefined" ||
    typeof TurndownService === "undefined"
  ) {
    console.error("Required libraries not loaded:", {
      defuddle: typeof Defuddle,
      turndown: typeof TurndownService,
    });
    return;
  }

  // Run Defuddle to extract main content and metadata
  console.log("Initializing Defuddle parser");
  let defuddle = new Defuddle(document, { url: document.URL });
  let result;
  try {
    result = defuddle.parse();
    console.log("Defuddle parse result:", {
      hasContent: !!result.content,
      contentLength: result.content?.length,
      title: result.title,
      author: result.author,
      date: result.published,
      content: result.content,
    });
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

  console.log("Extracted content stats:", {
    contentHtmlLength: contentHtml.length,
    titleLength: titleText.length,
    hasAuthor: !!authorText,
    hasDate: !!dateText,
  });

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
  if (typeof highlightedCodeBlock === "function") {
    turndownService.use([highlightedCodeBlock, tables, taskListItems]);
    console.log("Applied GFM plugins");
  } else {
    console.warn("GFM plugins not available");
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

  // Get user preferences
  chrome.storage.sync.get(
    {
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
    },
    function (settings) {
      console.log("User settings:", settings);

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

      console.log("Final markdown stats:", {
        totalLength: fullMarkdown.length,
        hasFrontmatter: hasMetadata,
        contentStartsAt: fullMarkdown.indexOf(markdownBody),
      });

      // Send the markdown result back to the background script
      chrome.runtime.sendMessage({
        type: "markdownResult",
        text: fullMarkdown,
      });
    }
  );
})();
