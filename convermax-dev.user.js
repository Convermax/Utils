// ==UserScript==
// @name         convermax-dev
// @namespace    convermax-dev
// @version      2
// @run-at       document-start
// @grant        none
// @include      http://*
// @include      https://*
// ==/UserScript==

(function() {
  'use strict';

  window.Convermax = { loaded: true };

  new MutationObserver((_, observer) => {
    const scriptTag = document.querySelector('script[src*="convermax.com"]');

    if (scriptTag) {
      scriptTag.src = '';
      scriptTag.remove();

      setTimeout(() => {
        window.Convermax = {};

        console.log('%cConvermax DEV UserScript', 'color: palevioletred; background: darkslateblue; font-size: 44px;')
        
        injectScript('https://localhost:3000/vendor.dev.bundle.js');
        injectScript('https://localhost:3000/templates.js');
        injectScript('https://localhost:3000/main.js');
      }, 500);

      observer.disconnect();
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
