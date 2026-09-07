// ==UserScript==
// @name         Convermax Client
// @namespace    convermax-dev
// @description  convermax-dev-client
// @downloadURL  https://github.com/Convermax/Utils/raw/main/convermax-dev.user.js
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-dev.user.js
// @version      21
// @run-at       document-start
// @grant        none
// @match        *://*/*
// @exclude      *://*convermax.com/*
// @exclude      *://localhost.convermax.dev/*
// ==/UserScript==

(function () {
  'use strict';

  const localDevAddress = 'https://localhost.convermax.dev:3000';
  const localStoreKey = 'convermax-dev-local-store';
  const failedStoreKey = 'convermax-dev-failed-store';
  const searchScriptPattern = /^search(?:-[^./]+)?(?:\.min)?\.js$/;

  let stores;
  let selectedStore;
  let productionScript;
  let localStyle;
  let forceInjection = false;
  let reloadStarted = false;

  try {
    forceInjection = Boolean(localStorage['cm_inject-script']);
  } catch {
    // Storage may be unavailable on this page.
  }

  function log(message) {
    console.log(`[Convermax Dev v21] ${message}`);
  }

  function parseScript(element) {
    const url = new URL(element.src, location.href);
    const customerHost = url.hostname.match(/^([^.]+)\.myconvermax\.com$/);

    if (!customerHost && url.hostname !== 'client.convermax.com') {
      return null;
    }

    const filename = url.pathname.split('/').pop();
    if (!searchScriptPattern.test(filename)) {
      return null;
    }

    const staticScriptName = url.pathname.match(/^\/static\/([^/]+)\//)?.[1];
    const scriptId = staticScriptName || customerHost?.[1];

    if (!scriptId) {
      return null;
    }

    return {
      element,
      url,
      scriptId,
      backendStoreId: customerHost?.[1] || staticScriptName,
    };
  }

  function removeProductionAssets() {
    if (!productionScript) {
      const scripts = [...document.querySelectorAll('script[src]')]
        .map(parseScript)
        .filter(Boolean);

      productionScript = scripts[0];
    }

    if (!productionScript) {
      return;
    }

    for (const element of document.querySelectorAll('script[src]')) {
      const url = new URL(element.src, location.href);

      if (
        url.origin === productionScript.url.origin &&
        url.pathname === productionScript.url.pathname
      ) {
        element.remove();
      }
    }

    const productionCssPath = productionScript.url.pathname.replace(
      /(?:\.min)?\.js$/,
      '.css',
    );

    for (const element of document.querySelectorAll('link[rel="stylesheet"][href]')) {
      const url = new URL(element.href, location.href);

      if (
        url.origin === productionScript.url.origin &&
        url.pathname.replace(/\.min\.css$/, '.css') === productionCssPath
      ) {
        element.remove();
      }
    }
  }

  function updatePage() {
    if (!document.head) {
      return;
    }

    if (selectedStore) {
      if (!localStyle) {
        injectLocalAssets();
      }
    
      removeProductionAssets();
      return;
    }

    if (!stores) {
      return;
    }

    const scripts = [...document.querySelectorAll('script[src]')]
      .map(parseScript)
      .filter(Boolean);

    const configuredStoreId = window.Convermax?.config?.storeId;

    if (!scripts.length && !configuredStoreId && !forceInjection) {
      return;
    }

    if (scripts.length > 1) {
      log('Multiple production search scripts found. Local injection skipped.');
      observer.disconnect();
      return;
    }

    const connectedScript = scripts[0];

    let match = stores.find((store) => store.storeId === configuredStoreId);
    let matchSource = 'window.Convermax.config.storeId';

    if (!match && connectedScript) {
      match = stores.find((store) => store.storeId === connectedScript.scriptId);
      matchSource = 'connected script';
    }

    if (!match) {
      const websiteMatches = stores.filter(
        (store) => store.websiteOrigin === location.origin,
      );

      if (websiteMatches.length > 1) {
        log('Multiple local stores match this website. Local injection skipped.');
        observer.disconnect();
        return;
      }

      match = websiteMatches[0];
      matchSource = 'website origin';
    }

    if (!match) {
      return;
    }

    if (match.storeId === failedStoreId) {
      log(`Local store "${match.storeId}" failed on the previous load. Production retained.`);
      observer.disconnect();
      return;
    }

    if (window.ConvermaxDevScriptInjected) {
      observer.disconnect();
      return;
    }

    const cachedStore = {
      assetBaseUrl: match.assetBaseUrl,
      backendStoreId: configuredStoreId || connectedScript?.backendStoreId,
      productionScriptUrl: connectedScript?.url.href,
      storeId: match.storeId,
    };

    try {
      sessionStorage.setItem(localStoreKey, JSON.stringify(cachedStore));
    } catch {
      log('Session storage is unavailable. Local injection skipped.');
      observer.disconnect();
      return;
    }

    observer.disconnect();
    log(`Matched "${match.storeId}" via ${matchSource}. Reloading with local assets.`);
    location.reload();
  }

  function injectLocalAssets() {
    window.Convermax.config = window.Convermax.config || {};

    if (!window.Convermax.config.storeId && selectedStore.backendStoreId) {
      window.Convermax.config.storeId = selectedStore.backendStoreId;
    }

    localStyle = document.createElement('link');
    localStyle.rel = 'stylesheet';
    localStyle.href = `${selectedStore.assetBaseUrl}/search.css`;
    localStyle.onerror = () => returnToProduction(`Failed to load ${localStyle.href}`);

    const cssOverride = document.querySelector('link[data-cm-override]');

    if (cssOverride) {
      cssOverride.before(localStyle);
    } else {
      document.head.appendChild(localStyle);
    }

    const localScript = document.createElement('script');
    localScript.src = `${selectedStore.assetBaseUrl}/search.js`;
    localScript.async = false;
    localScript.onerror = () => returnToProduction(`Failed to load ${localScript.src}`);
    document.head.appendChild(localScript);

    log(`Using "${selectedStore.storeId}" from session storage.`);
  }

  function returnToProduction(message) {
    if (reloadStarted) {
      return;
    }

    reloadStarted = true;

    try {
      sessionStorage.removeItem(localStoreKey);
      sessionStorage.setItem(failedStoreKey, selectedStore.storeId);
    } catch {
      // Storage may be unavailable on this page.
    }

    log(`${message}. Reloading with production assets.`);
    location.reload();
  }

  function readCachedStore() {
    try {
      const store = JSON.parse(sessionStorage.getItem(localStoreKey));

      if (
        typeof store?.storeId === 'string' &&
        typeof store?.assetBaseUrl === 'string'
      ) {
        return store;
      }
    } catch {
      // Storage may be unavailable on this page.
    }

    return null;
  }

  function takeFailedStoreId() {
    try {
      const storeId = sessionStorage.getItem(failedStoreKey);
      sessionStorage.removeItem(failedStoreKey);
      return storeId;
    } catch {
      return null;
    }
  }

  const failedStoreId = takeFailedStoreId();
  const cachedStore = readCachedStore();
  const observer = new MutationObserver(updatePage);

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'href'],
  });

  if (cachedStore) {
    if (window.Convermax?.loaded) {
      selectedStore = cachedStore;
      returnToProduction('Production started before local development could be enabled');
    } else {
      selectedStore = cachedStore;
      productionScript = cachedStore.productionScriptUrl
        ? { url: new URL(cachedStore.productionScriptUrl) }
        : null;

      window.Convermax = window.Convermax || {};
      window.Convermax.config = window.Convermax.config || {};

      if (!window.Convermax.config.storeId && selectedStore.backendStoreId) {
        window.Convermax.config.storeId = selectedStore.backendStoreId;
      }

      window.Convermax.devScriptEnabled = true;
      window.ConvermaxDevScriptInjected = true;

      updatePage();
    }
  } else {
    fetch(`${localDevAddress}/__convermax/stores`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Gateway returned ${response.status}`);
        }

        return response.json();
      })
      .then((registry) => {
        stores = registry.stores;

        if (!stores.length) {
          observer.disconnect();
          return;
        }

        updatePage();
      })
      .catch(() => {
        observer.disconnect();
      });
  }

  window.addEventListener('keydown', (event) => {
    if (!event.altKey || event.code !== 'Backquote' || !localStyle) {
      return;
    }

    const url = new URL(localStyle.href);
    url.searchParams.set('force_reload', Date.now());
    localStyle.href = url.href;
    log('CSS reloaded.');
  });
})();
