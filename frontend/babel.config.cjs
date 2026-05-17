/**
 * babel.config.cjs
 * Config Babel pour Jest (Vite a son propre pipeline et n'utilise pas
 * ce fichier — il n'est ni requis ni utilisé par `vite build`).
 *
 * Placement : frontend/babel.config.cjs
 */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
};
