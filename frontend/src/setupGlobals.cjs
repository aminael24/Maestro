// Polyfills globaux qui doivent être en place AVANT le chargement des modules.
// Notamment : TextEncoder/TextDecoder (utilisés par react-router-dom v7)

const { TextEncoder, TextDecoder } = require("util");
if (typeof global.TextEncoder === "undefined") global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === "undefined") global.TextDecoder = TextDecoder;

// scrollIntoView n'est pas implémenté par jsdom, on stubbe pour éviter les
// crashes des `goTo()` qui font document.getElementById(id).scrollIntoView(...)
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

// matchMedia stub global (sera ré-écrasé par setupTests.js si besoin)
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false;
      },
    };
  };
}
