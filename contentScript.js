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

  // Pre-process: Transform CodeTabs into standard code blocks before extraction
  try {
    console.log("Pre-processing CodeTabs before extraction");

    // Find all CodeTabs elements
    const codeTabElements = document.querySelectorAll(".CodeTabs");
    if (codeTabElements.length > 0) {
      console.log(
        `Found ${codeTabElements.length} CodeTabs elements to transform`
      );

      // Process each CodeTabs element
      codeTabElements.forEach((codeTab) => {
        // Create a container to hold transformed code blocks
        const codeBlocksContainer = document.createElement("div");
        codeBlocksContainer.className = "transformed-code-blocks";

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
          codeTab.parentNode.insertBefore(
            codeBlocksContainer,
            codeTab.nextSibling
          );

          // Don't remove the original - just make it have a special class
          // so we know it was processed but keep the original structure intact
          codeTab.classList.add("md-clipper-processed");
        }
      });

      console.log("Finished transforming CodeTabs elements");
    }
  } catch (err) {
    console.error("Error pre-processing CodeTabs:", err);
    // Continue even if pre-processing fails
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
  let contentHtml = result.content || "";

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

  // Get user preferences first
  chrome.storage.sync.get(
    {
      includeTitle: true,
      includeUrl: true,
      includeAuthor: true,
      includeDate: false,
      preserveTableLinebreaks: false,
    },
    function (settings) {
      console.log("User settings:", settings);

      // Make settings available to the GFM plugin
      window.markdownClipperSettings = settings;

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
