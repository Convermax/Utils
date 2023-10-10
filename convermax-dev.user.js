// ==UserScript==
// @name         convermax-dev
// @namespace    convermax-dev
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-dev.user.js
// @version      20
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

  const stylesHref = `https://localhost:3000/${window.Convermax.config.storeId}/search.css`;
  const scriptHref = `https://localhost:3000/${window.Convermax.config.storeId}/search.js`;

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

      const styleTag = document.querySelector('link[href*="convermax.com"]');
      let injectConfigured = false;

      try {
        injectConfigured = localStorage['cm_inject-script'];
      } catch (ex) {}

      if ((scriptTag || injectConfigured) && !window.ConvermaxDevScriptInjected) {
        if (scriptTag) {
          const src = scriptTag.getAttribute('src');
          window.Convermax.config.storeId =
            src.match(/\/{2}(.+)\.myconvermax.com/)?.[1] ??
            src.match(/client.convermax.com\/static\/(.+)\/search(\.min)\.js/)?.[1];
          scriptTag.src = '';
          scriptTag.remove();
        }

        window.ConvermaxDevScriptInjected = true;

        setTimeout(() => {
          observer.disconnect();

          log('Convermax DEV UserScript');

          injectStyles();
          injectScript();
        }, 500); // set it to 1000 or higher if script won't load
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

  function injectStyles() {
    const localStyleTag = document.createElement('link');
    localStyleTag.rel = 'stylesheet';
    localStyleTag.href = stylesHref;

    const styleTag = document.querySelector('link[href*="convermax.com"]');
    if (styleTag) {
      styleTag.parentElement.replaceChild(localStyleTag, styleTag);
    } else {
      document.body.appendChild(localStyleTag);
    }
  }

  function injectScript() {
    const scriptTag = document.createElement('script');
    scriptTag.src = scriptHref;
    scriptTag.async = false;
    scriptTag.crossOrigin = 'anonymous';

    document.body.appendChild(scriptTag);
  }

  function reloadCss() {
    const link = document.querySelector(`[href^=${stylesHref}]`);
    const href = new URL(link.href);
    href.searchParams.set('force_reload', Date.now());
    link.href = href;
  }
})();
