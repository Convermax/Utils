// ==UserScript==
// @name         convermax-dev
// @namespace    convermax-dev
// @version      13
// @run-at       document-start
// @grant        none
// @match        *://*/*
// ==/UserScript==

(function() {
  'use strict';

  window.Convermax = window.Convermax || {};
  window.Convermax.loaded = true; // for the legacy script version
  window.Convermax.devScriptEnabled = true;

  document.addEventListener("DOMContentLoaded", function() {
    new MutationObserver((_, observer) => {
    const scriptTag = [...document.querySelectorAll('script[src*="convermax.com"]')].find(s => s.src.includes('search.min.js'));

    if ((scriptTag || localStorage["cm_inject-script"]) && !window.ConvermaxDevScriptInjected) {
      if (scriptTag) {
        scriptTag.src = '';
        scriptTag.remove();
      }

      window.ConvermaxDevScriptInjected = true;

      setTimeout(() => {
        observer.disconnect();

        window.Convermax.loaded = false; // for the legacy script version

        console.log('%cConvermax DEV UserScript', 'color: palevioletred; background: darkslateblue; font-size: 44px;')

        injectScript('https://localhost:3000/vendor.dev.bundle.js');
        injectScript('https://localhost:3000/templates.js');
        injectScript('https://localhost:3000/main.js');
      }, 500);
    }

    const styleTag = document.querySelector('link[href*="convermax.com"]');

    if (styleTag) {
      const localStyleTag = document.createElement('link');
      localStyleTag.rel = 'stylesheet';
      localStyleTag.href = 'https://localhost:3000/search.css';
      styleTag.parentElement.replaceChild(localStyleTag, styleTag);
    }
  })
    .observe(document.documentElement, { childList: true, subtree: true });
});

  function injectScript(src) {
    const scriptTag = document.createElement('script');
    scriptTag.src = src;
    scriptTag.async = false;
    document.body.appendChild(scriptTag);
  }

})();
