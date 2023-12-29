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

  window.Convermax = window.Convermax || {};
  window.Convermax.config = window.Convermax.config || {};
  window.Convermax.devScriptEnabled = true;
  let storeId

  function createMutatuinObserver() {
    if (!document.documentElement) {
      window.setTimeout(createMutatuinObserver, 100);
      return;
    }

    new MutationObserver((_, observer) => {
      const liveScriptTag = [...document.querySelectorAll('script[src*="convermax.com"]')].find((s) =>
        s.src.includes('search.min.js'),
      );

      let forceInjectStoreId = null;
      try {
        const lsStoreId = localStorage['cm_inject-script'];

        if (lsStoreId !== 'true') {
          forceInjectStoreId = localStorage['cm_inject-script'];
        }
      } catch (ex) {}

      if ((liveScriptTag || forceInjectStoreId) && !window.ConvermaxDevScriptInjected) {
        window.ConvermaxDevScriptInjected = true;
        log('Convermax DEV Script v2 has been integrated');

        if (liveScriptTag) {
          const src = liveScriptTag.getAttribute('src');
          storeId = window.Convermax.config.storeId
          if (!storeId) {
            storeId =
              src.match(/\/{2}(.+)\.myconvermax.com/)?.[1] ??
              src.match(/client.convermax.com\/static\/(.+)\/search(\.min)\.js/)?.[1];
          }

          liveScriptTag.remove();
        }

        if (!storeId && forceInjectStoreId) {
          storeId = forceInjectStoreId
        }

        setTimeout(() => {
          observer.disconnect();

          injectStyles(storeId);
          injectScript(storeId);
        }, 500); // set it to 1000 or higher if script won't load
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  createMutatuinObserver();

  window.addEventListener('keydown', (e) => {
    const keyCode = e.code;

    if (keyCode === 'Backquote' && keyCode === 'AltLeft') {
      reloadCss(storeId);
    }
  });

  function injectStyles(storeId) {
    const hostedStyleTag = document.createElement('link');
    hostedStyleTag.rel = 'stylesheet';
    hostedStyleTag.href = `https://localhost:3000/${storeId}/search.css`;

    const liveStyleTag = document.querySelector('link[href*="convermax.com"]');
    if (liveStyleTag) {
      liveStyleTag.parentElement.replaceChild(hostedStyleTag, liveStyleTag);
    } else {
      document.body.appendChild(hostedStyleTag);
    }
  }

  function injectScript(storeId) {
    const hostedScriptTag = document.createElement('script');
    hostedScriptTag.src = `https://localhost:3000/${storeId}/search.js`;
    hostedScriptTag.async = false;
    hostedScriptTag.crossOrigin = 'anonymous';

    document.body.appendChild(hostedScriptTag);
  }

  function reloadCss(storeId) {
    const link = document.querySelector(`[href^="https://localhost:3000/${storeId}/search.js"]`);
    const href = new URL(link.href);
    href.searchParams.set('force_reload', Date.now());
    link.href = href;
  }
})();
