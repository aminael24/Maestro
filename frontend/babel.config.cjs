/**
 * babel.config.cjs
 * Babel config pour Jest uniquement (Vite n'en a pas besoin)
 *
 * Placement : frontend/babel.config.cjs
 */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
