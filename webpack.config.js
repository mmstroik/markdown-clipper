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
  console.log(`Build mode: ${isProduction ? "production" : "development"}`);

  return {
    entry: {
      background: "./background.js",
      contentScript: "./contentScript.js",
    },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
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
          { from: "manifest.json", to: "manifest.json" },
          { from: "turndown-plugin-gfm.js", to: "turndown-plugin-gfm.js" },
          { from: "copyHelper.js", to: "copyHelper.js" },
          { from: "icons", to: "icons" },
          { from: "options.html", to: "options.html" },
          { from: "options.js", to: "options.js" },
          { from: "output.html", to: "output.html" },
          { from: "output.css", to: "output.css" },
          { from: "output.js", to: "output.js" },
        ],
      }),
      ...(isProduction
        ? [
            new ZipPlugin({
              path: path.resolve(__dirname, "builds"),
              filename: `markdown-clipper-${package.version}.zip`,
            }),
          ]
        : []),
    ],
  };
};
