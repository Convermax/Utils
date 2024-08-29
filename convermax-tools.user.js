// ==UserScript==
// @name         Convermax Tools
// @namespace    convermax-dev
// @version      0.5.3
// @description  Convermax Tools
// @downloadURL  https://github.com/Convermax/Utils/raw/main/convermax-tools.user.js
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-tools.user.js
// @author       Miha_xXx
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=convermax.com
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @sandbox      JavaScript
// ==/UserScript==
/* eslint-disable no-console, no-undef, camelcase */

const scriptInfo = GM_info.script;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function registerPlatformAdminMenuCommand() {
  if (window.unsafeWindow?.Shopify) {
    GM_registerMenuCommand(`Shopify admin - Themes`, function () {
      GM_openInTab(`${window.location.origin}/admin/themes`, {
        active: true,
      });
    });

    const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;

    if (page?.pageType === 'product' || page?.pageType === 'collection') {
      GM_registerMenuCommand(`${capitalizeFirstLetter(page?.pageType)} at Shopify admin`, function () {
        GM_openInTab(`${window.location.origin}/admin/${page.pageType}s/${page.resourceId}`, {
          active: true,
        });
      });
      console.log(`[${scriptInfo.name} v${scriptInfo.version} UserScript]: Admin link registered at menu`);
    }
  } else if (window.unsafeWindow?.BCData) {
    const storeId = document
      .querySelector("head link[rel='dns-prefetch preconnect'][href*='.bigcommerce.com/s-']")
      ?.href?.split('s-')[1];

    if (storeId) {
      GM_registerMenuCommand(`BigCommerce admin`, function () {
        GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage`, {
          active: true,
        });
      });
    }

    const productId = document.querySelector('input[name=product_id]')?.value;

    if (storeId && productId) {
      GM_registerMenuCommand('Product at BigCommerce admin', function () {
        GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage/products/edit/${productId}`, {
          active: true,
        });
      });
      console.log(`[${scriptInfo.name} v${scriptInfo.version} UserScript]: Admin link registered at menu`);
    }
  }
}

function registerFitmentsMenuCommand() {
  const storeId = window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.serverUrl
    ?.replace('https://', '')
    .replace('.myconvermax.com', '');
  const productId = window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId;
  if (storeId && productId) {
    GM_registerMenuCommand('Fitment chart', function () {
      GM_openInTab(
        `https://${storeId}.myconvermax.com/ymm/fitments.html?productId=${productId}&includeSource=true`,
        { active: true },
      );
    });
    console.log(
      `[${scriptInfo.name} v${scriptInfo.version} UserScript]: Fitment chart link registered at menu`,
    );
  }
}

function registerConvermaxAdminMenuCommand() {
  const storeId = window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.serverUrl
    ?.replace('https://', '')
    .replace('.myconvermax.com', '');
  if (storeId) {
    GM_registerMenuCommand('Store status at Convermax admin', function () {
      GM_openInTab(`https://myconvermax.com/${storeId}/status`, { active: true });
    });
    console.log(
      `[${scriptInfo.name} v${scriptInfo.version} UserScript]: Convermax admin link registered at menu`,
    );
  }
}

function isShopifyAdminFixTimeoutExpired() {
  return Date.now() - GM_getValue('fixShopifyAdminStartedAt', 0) > 30 * 1000;
}

function fixNoAccessToShopifyAdmin() {
  const url = window.location.href;
  const path = url.replace('https://admin.shopify.com/store/', '');
  const storeId = path.replace(/\/.*/, '');
  const isAdminLogin = url.startsWith('https://admin.shopify.com/store/');
  const isNotAllowed = !!document
    .querySelector(
      '#app .Polaris-LegacyCard .Polaris-Box .Polaris-EmptyState__ImageContainer + .Polaris-Box span.Polaris-Text--root.Polaris-Text--bodySm',
    )
    ?.innerText?.includes("doesn't have permission to view this page");
  const redirectPath = GM_getValue('fixShopifyAdminLocation', '');

  if (isAdminLogin && isNotAllowed) {
    GM_setValue('fixShopifyAdminStartedAt', Date.now());
    GM_setValue('fixShopifyAdminLocation', path.replace(storeId, ''));
    window.location.replace(`https://partners.shopify.com/201897/stores?search_value=${storeId}`);
  } else if (isAdminLogin && !isShopifyAdminFixTimeoutExpired() && redirectPath) {
    GM_setValue('fixShopifyAdminLocation', '');
    window.location.replace(`https://admin.shopify.com/store/${storeId}${redirectPath}`);
  }
}

function fixNoStoreAtShopifyPartners() {
  if (isShopifyAdminFixTimeoutExpired()) {
    return;
  }

  const url = window.location.href;
  const isPartnersSearch = url.startsWith('https://partners.shopify.com/201897/stores?search_value=');
  const isNoResults = !!document
    .querySelector(
      '#AppFrameMain .Polaris-ResourceList__EmptySearchResultWrapper .Polaris-Text--root.Polaris-Text--headingLg',
    )
    ?.innerText?.includes('No stores found');
  const isTabSelected = url.includes('tab=');
  const Results = document.querySelectorAll(
    '#AppFrameMain .Polaris-ResourceList .Polaris-ResourceItem__ListItem',
  );

  if (isPartnersSearch && isNoResults && !isTabSelected) {
    window.location.replace(`${url}&tab=inactive`);
  } else if (isPartnersSearch && !isTabSelected && [...Results].length === 1) {
    const form = Results[0].querySelector('form[action^="/201897/stores/"][action$="/login_managed"]');
    form.removeAttribute('target');
    form.querySelector('button[type="submit"]').click();
  }
}

function ensureContextIsSet(getContext, timeout) {
  const start = Date.now();
  return new Promise(waitForContext).catch(() => {});

  function waitForContext(resolve, reject) {
    const context = getContext();
    if (context) {
      resolve(context);
    } else if (timeout && Date.now() - start >= timeout) {
      reject(() => null);
    } else {
      setTimeout(waitForContext.bind(this, resolve, reject), 30);
    }
  }
}

(function () {
  'use strict';

  ensureContextIsSet(() => window.unsafeWindow?.Convermax?.initialized, 10000).then(function () {
    registerConvermaxAdminMenuCommand();
    registerFitmentsMenuCommand();
  });

  ensureContextIsSet(() => window.unsafeWindow?.Shopify || window.unsafeWindow?.BCData, 10000).then(
    function () {
      registerPlatformAdminMenuCommand();
    });

  setTimeout(fixNoAccessToShopifyAdmin, 1000);
  setTimeout(fixNoStoreAtShopifyPartners, 2000);
})();
