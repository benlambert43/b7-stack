/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-classnames",
    "prettier-plugin-merge",
  ],
  tailwindStylesheet: "./b7-stack-web/app/globals.css",
  endingPosition: "absolute",
};

export default config;
