/**
 * Turndown Plugin GFM - Adds GitHub Flavored Markdown support (tables, task lists, code blocks).
 * Derived from turndown-plugin-gfm.
 */
(function () {
  // Utility regex and helpers for code block conversion
  var highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;
  var indexOf = Array.prototype.indexOf;
  var every = Array.prototype.every;

  // Plugin: convert highlighted code blocks (e.g., GitHub or Prism highlight wrappers)
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
        // Clean up the content: remove newlines, trim whitespace, escape pipes
        var cleanedContent = content
          .replace(/\n+/g, " ") // Replace one or more newlines with a single space
          .replace(/\|/g, "\\|") // Escape pipe characters
          .trim(); // Remove leading/trailing whitespace
        return cell(cleanedContent, node); // Use the cleaned content
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
        // Output the row and optional header separator
        return "\n" + content + (borderCells ? "\n" + borderCells : "");
      },
    },
    table: {
      filter: function (node) {
        // Only convert tables with a heading row
        return (
          node.nodeName === "TABLE" &&
          node.rows.length > 0 &&
          isHeadingRow(node.rows[0])
        );
      },
      replacement: function (content) {
        // Remove extra blank lines and wrap table in newlines
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

  // Plugin: tables (convert HTML tables to Markdown tables)
  function tables(turndownService) {
    // Keep tables without a header row intact (do not convert those)
    /* // Commented out to allow conversion of tables without standard headers
    turndownService.keep(function (node) {
      return (
        node.nodeName === "TABLE" &&
        node.rows.length > 0 &&
        !isHeadingRow(node.rows[0])
      );
    });
    */
    // Add all table conversion rules
    for (var ruleName in tableRules) {
      turndownService.addRule(ruleName, tableRules[ruleName]);
    }
  }

  // Plugin: task list items (convert <input type="checkbox"> in <li> to [x] or [ ])
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
