// ==UserScript==
// @name         Convermax Tools
// @namespace    convermax-dev
// @version      0.4.0
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

function registerAdminMenuCommand() {
  if (window.unsafeWindow?.Shopify) {
    const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;

    if (page?.pageType === 'product' || page?.pageType === 'collection') {
      GM_registerMenuCommand('Open at Shopify admin', function () {
        GM_openInTab(`${window.location.origin}/admin/${page.pageType}s/${page.resourceId}`, {
          active: true,
        });
      });
      console.log(`[${scriptInfo.name} v${scriptInfo.version} UserScript]: Admin link registered at menu`);
    }
  } else if (window.unsafeWindow?.BCData) {
    const productId = document.querySelector('input[name=product_id]')?.value;
    const storeId = document
      .querySelector("head link[rel='dns-prefetch preconnect'][href*='.bigcommerce.com/s-']")
      ?.href?.split('s-')[1];

    if (productId && storeId) {
      GM_registerMenuCommand('Open at BigCommerce admin', function () {
        GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage/products/edit/${productId}`, {
          active: true,
        });
      });
      console.log(`[${scriptInfo.name} v${scriptInfo.version} UserScript]: Admin link registered at menu`);
    }
  }
}

function registerFitmentsMenuCommand() {
  if (window.unsafeWindow?.Shopify) {
    const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;

    if (page?.pageType === 'product') {
      GM_registerMenuCommand('Open Fitment chart', function () {
        GM_openInTab(
          `${window.location.origin}/admin/apps/year-make-model-fitment-search/product_fitments?bypassAppUpdate=true&id=${page.resourceId}&shop=${window.unsafeWindow?.Shopify?.shop}`,
          { active: true },
        );
      });
      console.log(
        `[${scriptInfo.name} v${scriptInfo.version} UserScript]: Fitment chart link registered at menu`,
      );
    }
  } else if (window.unsafeWindow?.Convermax) {
    const poductId = window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId;
    if (poductId) {
      GM_registerMenuCommand('Open Fitment chart', function () {
        GM_openInTab(
          `https://${window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.storeId}.myconvermax.com/ymm/fitments.json?productId=${poductId}&includeSource=true`,
          { active: true },
        );
      });
      console.log(
        `[${scriptInfo.name} v${scriptInfo.version} UserScript]: Fitment chart link registered at menu`,
      );
    }
  }
}

function fixNoAccessToShopifyAdmin() {
  const url = window.location.href;
  const storeId = url.replace('https://admin.shopify.com/store/', '');
  const isAdminLogin = url.startsWith('https://admin.shopify.com/store/') && !storeId?.match(/\//g)?.length;
  const isNotAllowed = !!document
    .querySelector(
      '#app .Polaris-LegacyCard .Polaris-Box .Polaris-EmptyState__ImageContainer + .Polaris-Box span.Polaris-Text--root.Polaris-Text--bodySm',
    )
    ?.innerText?.includes("doesn't have permission to view this page");

  if (isAdminLogin && isNotAllowed) {
    GM_setValue('fixShopifyAdminStartedAt', Date.now());
    window.location.replace(`https://partners.shopify.com/201897/stores?search_value=${storeId}`);
  }
}

function fixNoStoreAtShopifyPartners() {
  if (Date.now() - GM_getValue('fixShopifyAdminStartedAt', 0) > 30 * 1000) {
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
    Results[0]
      .querySelector('form[action^="/201897/stores/"][action$="/login_managed"] button[type="submit"]')
      .click();
  }
}

(function () {
  'use strict';

  setTimeout(registerFitmentsMenuCommand, 1000);
  setTimeout(registerAdminMenuCommand, 1000);
  setTimeout(fixNoAccessToShopifyAdmin, 1000);
  setTimeout(fixNoStoreAtShopifyPartners, 2000);
})();
