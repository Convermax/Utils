// ==UserScript==
// @name         convermax-dev
// @namespace    convermax-dev
// @version      8
// @run-at       document-start
// @grant        none
// @include      http://*
// @include      https://*
// ==/UserScript==

(function() {
  'use strict';

  window.Convermax = window.Convermax || {};
  window.Convermax.loaded = true;

  new MutationObserver((_, observer) => {
    const scriptTag = [...document.querySelectorAll('script[src*="convermax.com"]')].find(s => s.src.includes('search.min.js'));

    if ((scriptTag || localStorage["cm_inject-script"]) && !window.ConvermaxInjected) {
      if (scriptTag) {
        scriptTag.src = '';
        scriptTag.remove();
      }

      window.ConvermaxInjected = true;

      setTimeout(() => {
        observer.disconnect();

        window.Convermax.loaded = false;

        console.log('%cConvermax DEV UserScript', 'color: palevioletred; background: darkslateblue; font-size: 44px;')

        injectScript('https://localhost:3000/vendor.dev.bundle.js');
        injectScript('https://localhost:3000/templates.js');
        injectScript('https://localhost:3000/main.js');
      }, 500);
    }

    const styleTag = document.querySelector('link[href*="convermax.com"]');

    if (styleTag) {
      styleTag?.remove();
      const localStyleTag = document.createElement('link');
      localStyleTag.rel = 'stylesheet';
      localStyleTag.href = 'https://localhost:3000/search.css';
    }
  })
    .observe(document.documentElement, { childList: true, subtree: true });

  function injectScript(src) {
    const scriptTag = document.createElement('script');
    scriptTag.src = src;
    scriptTag.async = false;
    document.body.appendChild(scriptTag);
  }

})();
