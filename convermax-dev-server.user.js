// ==UserScript==
// @name         Convermax Dev Server
// @namespace    convermax-dev
// @description  convermax-dev-server
// @downloadURL  https://github.com/Convermax/Utils/raw/main/convermax-dev-server.user.js
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-dev-server.user.js
// @version      1.0
// @run-at       document-start
// @grant        none
// @match        *://*/*
// @exclude      *://*convermax.com/*
// ==/UserScript==

(function () {
  'use strict';

  window.Convermax = window.Convermax || {};
  window.Convermax.config = window.Convermax.config || {};
  window.Convermax.useDevServer = true;
})();
