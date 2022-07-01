// ==UserScript==
// @name         convermax-dev
// @namespace    convermax-dev
// @description  convermax-dev
// @version      16
// @run-at       document-start
// @grant        none
// @match        *://*/*
// ==/UserScript==

(function () {
  'use strict';

  window.Convermax = window.Convermax || {};
  window.Convermax.devScriptEnabled = true;

  function createMutatuinObserver() {
    if (!document.documentElement) {
      window.setTimeout(createMutatuinObserver, 200);
      return;
    }

    new MutationObserver((_, observer) => {
      const scriptTag = [...document.querySelectorAll('script[src*="convermax.com"]')].find((s) =>
        s.src.includes('search.min.js'),
      );

      if ((scriptTag || localStorage['cm_inject-script']) && !window.ConvermaxDevScriptInjected) {
        if (scriptTag) {
          scriptTag.src = '';
          scriptTag.remove();
        }

        window.ConvermaxDevScriptInjected = true;

        setTimeout(() => {
          observer.disconnect();

          console.log(
            '%cConvermax DEV UserScript',
            'color: white; background: black; font-size: 44px; text-align: center; padding: 1rem; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, Roboto, Oxygen, , Cantarell, sans-serif;',
          );

          injectScript('https://localhost:3000/vendor.dev.bundle.js');
          injectScript('https://localhost:3000/templates.js');
          injectScript('https://localhost:3000/main.js');
        }, 1000);
      }

      const styleTag = document.querySelector('link[href*="convermax.com"]');

      if (styleTag) {
        const localStyleTag = document.createElement('link');
        localStyleTag.rel = 'stylesheet';
        localStyleTag.href = 'https://localhost:3000/search.css';
        styleTag.parentElement.replaceChild(localStyleTag, styleTag);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  createMutatuinObserver();
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F9') {
      reloadCss();
    }
  });

  function injectScript(src) {
    const scriptTag = document.createElement('script');
    scriptTag.src = src;
    scriptTag.async = false;
    document.body.appendChild(scriptTag);
  }

  function reloadCss() {
    document.querySelector('[href="https://localhost:3000/search.css"]').href += '';
  }
})();
