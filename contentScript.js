import TurndownService from "turndown";
import { Readability } from "@mozilla/readability";
import Defuddle from "defuddle";

function preprocessCodeTabsForDefuddle() {
  console.log("Pre-processing CodeTabs for Defuddle");
  const transformedContainers = [];

  const codeTabElements = document.querySelectorAll(
    ".CodeTabs:not(.md-clipper-processed)"
  );
  if (codeTabElements.length === 0) {
    console.log("No new CodeTabs elements found to transform for Defuddle.");
    return transformedContainers;
  }

  console.log(
    `Found ${codeTabElements.length} CodeTabs elements to transform for Defuddle`
  );

  codeTabElements.forEach((codeTab) => {
    const codeBlocksContainer = document.createElement("div");
    codeBlocksContainer.className =
      "transformed-code-blocks md-clipper-temporary";
    transformedContainers.push(codeBlocksContainer);

    const codeElements = codeTab.querySelectorAll("code[data-lang]");

    if (codeElements.length > 0) {
      codeElements.forEach((codeEl) => {
        const language = codeEl.getAttribute("data-lang") || "";
        const tabName = codeEl.getAttribute("name") || "";
        const codeText = codeEl.textContent || "";

        const preElement = document.createElement("pre");
        const codeElement = document.createElement("code");

        codeElement.className = `language-${language.toLowerCase()}`;
        if (tabName) {
          codeElement.setAttribute("data-tab-name", tabName);
        }

        codeElement.textContent = codeText;

        if (tabName) {
          const headerDiv = document.createElement("div");
          headerDiv.className = "code-tab-header";
          headerDiv.textContent = `// ${tabName}`;
          codeBlocksContainer.appendChild(headerDiv);
        }

        preElement.appendChild(codeElement);
        codeBlocksContainer.appendChild(preElement);
      });

      codeTab.parentNode.insertBefore(codeBlocksContainer, codeTab.nextSibling);

      codeTab.classList.add("md-clipper-processed");
    }
  });

  console.log("Finished transforming CodeTabs elements for Defuddle.");
  return transformedContainers;
}

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

async function parseWithReadability() {
  console.log("Using Readability parser.");

  const documentClone = document.cloneNode(true);

  console.log("Initializing Readability parser");
  const reader = new Readability(documentClone);
  const result = reader.parse();
  console.log("Readability parse result:", {
    hasContent: !!result.content,
    contentLength: result.content?.length,
    title: result.title,
    author: result.byline,
    date: result.siteName,
  });

  return result;
}

async function parseWithDefuddle() {
  console.log("Using Defuddle parser.");

  const temporaryElements = preprocessCodeTabsForDefuddle();

  try {
    console.log("Initializing Defuddle parser");
    let defuddle = new Defuddle(document, { url: document.URL });
    const result = defuddle.parse();
    console.log("Defuddle parse result:", {
      hasContent: !!result.content,
      contentLength: result.content?.length,
      title: result.title,
      author: result.author,
      date: result.published,
    });

    result.byline = result.author;
    result.siteName = result.published;

    return result;
  } finally {
    cleanupTemporaryElements(temporaryElements);
  }
}

function convertToMarkdown(
  contentHtml,
  settings,
  titleText,
  authorText,
  dateText,
  urlText
) {
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

  if (
    typeof window.highlightedCodeBlock === "function" &&
    typeof window.tables === "function" &&
    typeof window.taskListItems === "function"
  ) {
    const tablesPluginWithSettings = (service) => {
      window.tables(service, settings);
    };

    turndownService.use([
      window.highlightedCodeBlock,
      tablesPluginWithSettings,
      window.taskListItems,
    ]);
    console.log("Applied GFM plugins (tables with settings).");
  } else {
    console.warn(
      "GFM plugins (highlightedCodeBlock, tables, or taskListItems) not fully available on window. Some GFM features might be missing."
    );
  }

  turndownService.remove(["script", "style"]);

  let markdownBody = "";
  try {
    markdownBody = turndownService.turndown(contentHtml);
    console.log("Markdown conversion complete", {
      markdownLength: markdownBody.length,
      firstChars: markdownBody.substring(0, 100),
    });
  } catch (err) {
    console.error("Turndown conversion error:", err);
    markdownBody = "";
  }

  let fullMarkdown = "";
  const hasMetadata =
    settings.includeTitle ||
    settings.includeUrl ||
    settings.includeAuthor ||
    settings.includeDate;

  if (hasMetadata) {
    function escapeYaml(str) {
      return str ? str.replace(/\n/g, " ").replace(/"/g, '\\"') : "";
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

  fullMarkdown += markdownBody;

  return fullMarkdown;
}

(async function () {
  console.log("Content script started");

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

  chrome.storage.sync.get(
    {
      parserChoice: "readability",
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
          readabilityResult = await parseWithReadability();
          defuddleResult = await parseWithDefuddle();

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

          chrome.runtime.sendMessage({
            type: "bothEnginesResult",
            readabilityText: readabilityMarkdown,
            defuddleText: defuddleMarkdown,
          });
          return;
        } else if (settings.parserChoice === "defuddle") {
          defuddleResult = await parseWithDefuddle();
          result = defuddleResult;
        } else {
          readabilityResult = await parseWithReadability();
          result = readabilityResult;
        }

        markdownContent = convertToMarkdown(
          result.content || "",
          settings,
          result.title || document.title || "",
          result.byline || "",
          result.siteName || "",
          document.URL
        );

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
