// ==UserScript==
// @name         convermax-dev
// @namespace    convermax-dev
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-dev.user.js
// @version      19.3
// @run-at       document-start
// @grant        none
// @match        *://*/*
// ==/UserScript==

function log(message) {
  console.log(
    `%c${message}`,
    'color: #B0D142; background: black; font-size: 24px; text-align: center; padding: 1rem; text-transform: uppercase; font-weight: bold; font-family: Roboto, Cantarell, sans-serif;',
  );
}

(function () {
  'use strict';

  window.Convermax = window.Convermax || {};
  window.Convermax.config = window.Convermax.config || {};
  window.Convermax.devScriptEnabled = true;

  function createMutatuinObserver() {
    if (!document.documentElement) {
      window.setTimeout(createMutatuinObserver, 100);
      return;
    }

    new MutationObserver((_, observer) => {
      const scriptTag = [...document.querySelectorAll('script[src*="convermax.com"]')].find((s) =>
        s.src.includes('search.min.js'),
      );


      if ((scriptTag || localStorage['cm_inject-script']) && !window.ConvermaxDevScriptInjected) {
        if (scriptTag) {
          const src = scriptTag.getAttribute('src');

          if (!window.Convermax.config.storeId) {
            window.Convermax.config.storeId =
              src.match(/\/{2}(.+)\.myconvermax.com/)?.[1] ??
              src.match(/client.convermax.com\/static\/(.+)\/search(\.min)\.js/)?.[1];
          }

          scriptTag.remove();
        }

        window.ConvermaxDevScriptInjected = true;

        setTimeout(() => {
          observer.disconnect();

          log('Convermax DEV UserScript');

          injectScript('https://localhost:3000/vendor.dev.bundle.js');
          injectScript('https://localhost:3000/templates.js');
          injectScript('https://localhost:3000/main.js');
        }, 500); // set it to 1000 or higher if script won't load
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
    if (e.keyCode === 192 && e.altKey) {
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
    const link = document.querySelector('[href^="https://localhost:3000/search.css"]');
    const href = new URL(link.href);
    href.searchParams.set('force_reload', Date.now());
    link.href = href;
    log('CSS Reloaded');
  }
})();
