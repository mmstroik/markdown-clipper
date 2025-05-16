/**
 * Customized Turndown GFM - Adds GitHub Flavored Markdown support (tables, task lists, code blocks).
 */
(function () {
  // Utility regex and helpers for code block conversion
  var highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;
  var indexOf = Array.prototype.indexOf;
  var every = Array.prototype.every;

  function highlightedCodeBlock(turndownService) {
    turndownService.addRule("highlightedCodeBlock", {
      filter: function (node) {
        var firstChild = node.firstChild;
        return (
          node.nodeName === "DIV" &&
          highlightRegExp.test(node.className || "") &&
          firstChild &&
          firstChild.nodeName === "PRE"
        );
      },
      replacement: function (content, node, options) {
        var className = node.className || "";
        var language = (className.match(highlightRegExp) || [null, ""])[1];
        return (
          "\n\n" +
          options.fence +
          (language || "") +
          "\n" +
          node.firstChild.textContent +
          "\n" +
          options.fence +
          "\n\n"
        );
      },
    });

    turndownService.addRule("codeTabHeader", {
      filter: function (node) {
        return (
          node.nodeName === "DIV" &&
          (node.className || "").includes("code-tab-header")
        );
      },
      replacement: function (content, node) {
        return "\n" + content + "\n";
      },
    });

    turndownService.addRule("transformedCodeBlocks", {
      filter: function (node) {
        return (
          node.nodeName === "DIV" &&
          (node.className || "").includes("transformed-code-blocks")
        );
      },
      replacement: function (content) {
        return content;
      },
    });

    // Rule for CodeTabs (original structure) - only as a fallback
    turndownService.addRule("codeTabs", {
      filter: function (node) {
        return (
          node.nodeName === "DIV" &&
          (node.className || "").includes("CodeTabs") &&
          // Only process if not already processed (missing md-clipper-processed class)
          !(node.className || "").includes("md-clipper-processed")
        );
      },
      replacement: function (content, node, options) {
        // Fallback handler for any CodeTabs that weren't pre-processed
        var codeBlocks = [];
        var codeElements = node.querySelectorAll("code[data-lang]");

        if (codeElements.length === 0) return content; // No code found

        for (var i = 0; i < codeElements.length; i++) {
          var codeEl = codeElements[i];
          var language = codeEl.getAttribute("data-lang") || "";
          // Get the actual text content, not the HTML with spans
          var codeText = codeEl.textContent || "";

          var tabName = codeEl.getAttribute("name");
          var tabLabel = tabName ? "(" + tabName + ")" : "";

          codeBlocks.push(
            "\n\n" +
              options.fence +
              language.toLowerCase() +
              tabLabel +
              "\n" +
              codeText +
              "\n" +
              options.fence
          );
        }

        return codeBlocks.join("\n\n") + "\n\n";
      },
    });

    turndownService.addRule("preCode", {
      filter: function (node) {
        return (
          node.nodeName === "PRE" &&
          node.firstChild &&
          node.firstChild.nodeName === "CODE"
        );
      },
      replacement: function (_, node, options) {
        var language = "";
        var tabName = "";
        var codeNode = node.firstChild;

        if (codeNode.className) {
          var classMatch =
            codeNode.className.match(/language-(\w+)/) ||
            codeNode.className.match(/lang-(\w+)/) ||
            codeNode.className.match(/rdmd-code lang-(\w+)/);
          if (classMatch) language = classMatch[1];
        }

        // Or from data-lang attribute
        if (!language && codeNode.getAttribute) {
          language = codeNode.getAttribute("data-lang") || "";
        }

        // Get tab name if available
        if (codeNode.getAttribute) {
          tabName = codeNode.getAttribute("data-tab-name") || "";
        }

        // Add tab name as a comment in the language line if present
        var languageLine = language;
        if (tabName) {
          languageLine += " # " + tabName;
        }

        return (
          "\n\n" +
          options.fence +
          languageLine +
          "\n" +
          codeNode.textContent +
          "\n" +
          options.fence +
          "\n\n"
        );
      },
    });
  }

  // Helper functions for tables
  function isHeadingRow(tr) {
    var parent = tr.parentNode;
    return (
      parent.nodeName === "THEAD" ||
      (parent.firstChild === tr &&
        (parent.nodeName === "TABLE" || isFirstTbody(parent)) &&
        every.call(tr.childNodes, function (n) {
          return n.nodeName === "TH";
        }))
    );
  }
  function isFirstTbody(element) {
    var prevSibling = element.previousSibling;
    return (
      element.nodeName === "TBODY" &&
      (!prevSibling ||
        (prevSibling.nodeName === "THEAD" &&
          /^\s*$/.test(prevSibling.textContent)))
    );
  }
  function cell(content, node) {
    var index = indexOf.call(node.parentNode.childNodes, node);
    var prefix = index === 0 ? "| " : " ";
    return prefix + content + " |";
  }

  // Table conversion rules
  var tableRules = {
    tableCell: {
      filter: ["th", "td"],
      replacement: function (content, node) {
        var preserveLinebreaks = settings && settings.preserveTableLinebreaks;

        var cleanedContent;
        if (preserveLinebreaks) {
          cleanedContent = content
            .replace(/^\n+|\n+$/g, "") // Remove leading/trailing newlines first
            .replace(/\n+/g, "<br>") // Replace internal newlines with <br> tags
            .replace(/\|/g, "\\|") // Escape pipe characters
            .trim(); // Remove any remaining whitespace
        } else {
          cleanedContent = content
            .replace(/\n+/g, " ") // Replace newlines with spaces
            .replace(/\|/g, "\\|") // Escape pipe characters
            .trim(); // Remove leading/trailing whitespace
        }

        return cell(cleanedContent, node);
      },
    },
    tableRow: {
      filter: "tr",
      replacement: function (content, node) {
        var borderCells = "";
        var alignMap = { left: ":--", right: "--:", center: ":-:" };
        if (isHeadingRow(node)) {
          // Add an underline for header row
          for (var i = 0; i < node.childNodes.length; i++) {
            var border = "---";
            var align = (
              node.childNodes[i].getAttribute("align") || ""
            ).toLowerCase();
            if (align) {
              border = alignMap[align] || border;
            }
            borderCells += cell(border, node.childNodes[i]);
          }
        }
        return "\n" + content + (borderCells ? "\n" + borderCells : "");
      },
    },
    table: {
      filter: function (node) {
        return (
          node.nodeName === "TABLE" &&
          node.rows.length > 0 &&
          isHeadingRow(node.rows[0])
        );
      },
      replacement: function (content) {
        content = content.replace("\n\n", "\n");
        return "\n\n" + content + "\n\n";
      },
    },
    tableSection: {
      filter: ["thead", "tbody", "tfoot"],
      replacement: function (content) {
        return content;
      },
    },
  };

  function tables(turndownService) {
    for (var ruleName in tableRules) {
      turndownService.addRule(ruleName, tableRules[ruleName]);
    }
  }

  function taskListItems(turndownService) {
    turndownService.addRule("taskListItems", {
      filter: function (node) {
        return node.type === "checkbox" && node.parentNode.nodeName === "LI";
      },
      replacement: function (content, node) {
        return (node.checked ? "[x]" : "[ ]") + " ";
      },
    });
  }

  // Expose plugin functions to global scope
  window.highlightedCodeBlock = highlightedCodeBlock;
  window.tables = tables;
  window.taskListItems = taskListItems;
})();
