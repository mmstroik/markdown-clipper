const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const package = require("./package.json");
const fs = require("fs");

// Ensure builds directory exists
const buildsDir = path.resolve(__dirname, "builds");
if (!fs.existsSync(buildsDir)) {
  fs.mkdirSync(buildsDir);
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const browser = env.BROWSER || "chrome"; // Default to chrome if not specified
  
  console.log(`Building for: ${browser}`);
  console.log(`Build mode: ${isProduction ? "production" : "development"}`);

  const outputDir = path.resolve(__dirname, `dist-${browser}`);
  
  // Determine which background script to use
  const backgroundScript = browser === "firefox" 
    ? "./src/firefox/background.js" 
    : "./src/shared/background.js";

  // Determine which manifest to use
  const manifestSource = browser === "firefox"
    ? "src/firefox/manifest.json"
    : "src/chrome/manifest.json";

  return {
    entry: {
      background: backgroundScript,
      contentScript: "./src/shared/contentScript.js",
    },
    output: {
      filename: "[name].js",
      path: outputDir,
      environment: {
        // The environment supports arrow functions
        arrowFunction: true,
        // The environment supports const/let
        const: true,
        // The environment supports destructuring
        destructuring: true,
        // The environment supports ECMAScript Module syntax
        module: true,
      },
    },
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? false : "inline-source-map",
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 2020,
            module: true,
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction
                ? ["console.log", "console.info", "console.debug"]
                : [],
              passes: 3,
              unsafe_math: true,
              unsafe_methods: true,
              unsafe_proto: true,
              unsafe_regexp: true,
              unsafe_undefined: true,
              dead_code: true,
              unused: true,
              toplevel: true,
            },
            mangle: {
              properties: {
                regex: /^_/,
              },
            },
            format: {
              comments: !isProduction,
              ecma: 2020,
            },
          },
          extractComments: false,
        }),
      ],
      usedExports: true,
      sideEffects: true,
      providedExports: true,
      innerGraph: true,
      mangleExports: isProduction,
      concatenateModules: isProduction,
    },
    resolve: {
      extensions: [".js", ".json"],
      mainFields: ["module", "browser", "main"],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: manifestSource, to: "manifest.json" },
          { from: "src/shared/turndown-gfm.js", to: "turndown-gfm.js" },
          { from: "src/shared/copyHelper.js", to: "copyHelper.js" },
          { from: "src/shared/icons", to: "icons" },
          { from: "src/shared/options.html", to: "options.html" },
          { from: "src/shared/options.js", to: "options.js" },
          { from: "src/shared/output.html", to: "output.html" },
          { from: "src/shared/output.css", to: "output.css" },
          { from: "src/shared/output.js", to: "output.js" },
        ],
      }),
      ...(isProduction
        ? [
            new ZipPlugin({
              path: path.resolve(__dirname, "builds"),
              filename: `markdown-clipper-${browser}-${package.version}.zip`,
            }),
          ]
        : []),
    ],
  };
};