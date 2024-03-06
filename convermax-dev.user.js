// ==UserScript==
// @name         convermax-dev
// @namespace    convermax-dev
// @description  convermax-dev
// @downloadURL  https://github.com/Convermax/Utils/raw/main/convermax-dev.user.js
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-dev.user.js
// @version      20.3
// @run-at       document-start
// @grant        none
// @match        *://*/*
// ==/UserScript==

function log(message) {
  // eslint-disable-next-line no-console
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
    if (!document.body) {
      window.setTimeout(createMutatuinObserver, 100);
      return;
    }

    let inject;
    try {
      inject = localStorage['cm_inject-script'];
    } catch (ex) {}

    new MutationObserver((_, observer) => {
      const scriptTag = [...document.querySelectorAll('script[src*="convermax.com"]')].find(
        (s) => s.src.includes('search.js') || s.src.includes('search.min.js'),
      );

      if ((scriptTag || inject) && !window.ConvermaxDevScriptInjected) {
        if (scriptTag) {
          const src = scriptTag.getAttribute('src');

          if (!window.Convermax.config.storeId) {
            window.Convermax.config.storeId =
              src.match(/\/{2}(.+)\.myconvermax.com/)?.[1] ??
              src.match(/client.convermax.com\/static\/(.+)\/search(\.min)?\.js/)?.[1];
          }

          scriptTag.remove();
        }

        window.ConvermaxDevScriptInjected = true;

        setTimeout(() => {
          observer.disconnect();

          log('Convermax DEV v20.2 UserScript');

          injectScript('https://localhost:3000/temp/search.js');
        }, 500); // set it to 1000 or higher if script won't load
      }

      const styleTag = document.querySelector('link[href*="convermax.com"]');

      if (styleTag) {
        const localStyleTag = document.createElement('link');
        localStyleTag.rel = 'stylesheet';
        localStyleTag.href = 'https://localhost:3000/temp/search.css';
        styleTag.parentElement.replaceChild(localStyleTag, styleTag);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  createMutatuinObserver();

  window.addEventListener('keydown', (e) => {
    const keyCode = e.code;

    if (keyCode === 'Backquote' && keyCode === 'AltLeft') {
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
    const link = document.querySelector('[href^="https://localhost:3000/temp/search.css"]');
    const href = new URL(link.href);
    href.searchParams.set('force_reload', Date.now());
    link.href = href;
    log('CSS Reloaded');
  }
})();
