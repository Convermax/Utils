// ==UserScript==
// @name         Convermax Tools
// @namespace    convermax-dev
// @version      0.7.0
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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function registerPlatformAdminMenuCommand() {
  if (window.unsafeWindow?.Shopify) {
    GM_registerMenuCommand(`Shopify Themes`, function () {
      GM_openInTab(`${window.location.origin}/admin/themes`, {
        active: true,
      });
    });

    const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;

    if (page?.pageType === 'Product' || page?.pageType === 'Collection') {
      GM_registerMenuCommand(`Shopify ${capitalizeFirstLetter(page?.pageType)}`, function () {
        GM_openInTab(`${window.location.origin}/admin/${page.pageType}s/${page.resourceId}`, {
          active: true,
        });
      });
    }
  } else if (window.unsafeWindow?.BCData) {
    const storeId = document
      .querySelector("head link[rel='dns-prefetch preconnect'][href*='.bigcommerce.com/s-']")
      ?.href?.split('s-')[1];

    if (storeId) {
      GM_registerMenuCommand(`BigCommerce Admin`, function () {
        GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage`, {
          active: true,
        });
      });
    }

    const productId = document.querySelector('input[name=product_id]')?.value;

    if (storeId && productId) {
      GM_registerMenuCommand('BigCommerce Product', function () {
        GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage/products/${productId}/edit`, {
          active: true,
        });
      });
    }
  } else if (window.unsafeWindow?.woocommerce_params) {
    GM_registerMenuCommand(`WooCommerce Admin`, function () {
      GM_openInTab(`${window.location.origin}/wp-admin/admin.php?page=wc-admin`, {
        active: true,
      });
    });
    const productId =
      window.unsafeWindow?.cm_product?.[0] ??
      window.unsafeWindow?.document.querySelector('button[name="add-to-cart"]')?.value;
    if (productId) {
      GM_registerMenuCommand('WooCommerce Product', function () {
        GM_openInTab(`${window.location.origin}/wp-admin/post.php?post=${productId}&action=edit`, {
          active: true,
        });
      });
    }
    const categoryHandle = window.location.pathname.includes('/product-category/')
      ? window.location.pathname.replace('/product-category/', '')
      : '';
    if (categoryHandle) {
      GM_registerMenuCommand('WooCommerce Category Products', function () {
        GM_openInTab(
          `${window.location.origin}/wp-admin/edit.php?product_cat=${categoryHandle}&post_type=product`,
          {
            active: true,
          },
        );
      });
    }
    const categoryName = window.unsafeWindow?.cm_category;
    if (categoryName) {
      GM_registerMenuCommand('WooCommerce Category (see 1st)', function () {
        GM_openInTab(
          `${window.location.origin}/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product&s=${categoryName.replace(' ', '+')}`,
          {
            active: true,
          },
        );
      });
    }
  }
}

function registerFitmentsMenuCommand() {
  const storeId = window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.serverUrl
    ?.replace('https://', '')
    ?.replace('.myconvermax.com', '')
    ?.replace('client.convermax.com/', '');
  const productId = window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId;
  const isFitmentSearch =
    !!window.unsafeWindow?.Convermax?.templates?.config?.fitmentSearchConfig?.fields?.length;

  if (storeId && isFitmentSearch && productId) {
    GM_registerMenuCommand('Fitment Chart', function () {
      GM_openInTab(
        `https://${storeId}.myconvermax.com/ymm/fitments.html?productId=${productId}&includeSource=true`,
        { active: true },
      );
    });
  }

  if (storeId && isFitmentSearch) {
    GM_registerMenuCommand('Vehicle Info', function () {
      if (window.unsafeWindow?.Convermax?.isVehicleSelected()) {
        const url = new URL(`https://${storeId}.myconvermax.com/ymm/vehicleinfo.html`);
        for (const [key, value] of Object.entries(window.unsafeWindow?.Convermax?.getVehicle())) {
          url.searchParams.set(key, value);
        }

        GM_openInTab(url.href, { active: true });
      } else {
        alert('Convermax Tools: No vehicle selected!');
      }
    });
  }
}

function registerConvermaxAdminMenuCommand() {
  const storeId = window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.serverUrl
    ?.replace('https://', '')
    .replace('.myconvermax.com', '');
  if (storeId) {
    GM_registerMenuCommand('Convermax Admin', function () {
      GM_openInTab(`https://myconvermax.com/${storeId}/status`, { active: true });
    });
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
    return true;
  } else if (isAdminLogin && !isShopifyAdminFixTimeoutExpired() && redirectPath) {
    GM_setValue('fixShopifyAdminLocation', '');
    window.location.replace(`https://admin.shopify.com/store/${storeId}${redirectPath}`);
    return true;
  }
  return false;
}

function fixNoStoreAtShopifyPartners() {
  if (isShopifyAdminFixTimeoutExpired()) {
    return false;
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
    return true;
  } else if (isPartnersSearch && !isTabSelected && [...Results].length === 1) {
    const form = Results[0].querySelector('form[action^="/201897/stores/"][action$="/login_managed"]');
    form.removeAttribute('target');
    form.querySelector('button[type="submit"]').click();
    return true;
  }
  return false;
}

function bypassShopifyPassword() {
  if (window.location.href.includes('.myshopify.com/password')) {
    window.location.replace(`${window.location.origin}/admin/themes`);
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
function registerHotkeys() {
  document.addEventListener('keydown', function(e) {
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
      const storeId = window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.serverUrl
        ?.replace('https://', '')
        ?.replace('.myconvermax.com', '')
        ?.replace('client.convermax.com/', '');
      
      switch (e.key) {
        case '1': // Convermax admin
          if (storeId) {
            e.preventDefault();
            GM_openInTab(`https://myconvermax.com/${storeId}/status`, { active: true });
          }
          break;

        case '2': // Platform admin
          e.preventDefault();
          if (window.unsafeWindow?.Shopify) {
            GM_openInTab(`${window.location.origin}/admin/themes`, { active: true });
          } else if (window.unsafeWindow?.BCData) {
            const bcStoreId = document.querySelector("head link[rel='dns-prefetch preconnect'][href*='.bigcommerce.com/s-']")?.href?.split('s-')[1];
            if (bcStoreId) {
              GM_openInTab(`https://store-${bcStoreId}.mybigcommerce.com/manage`, { active: true });
            }
          } else if (window.unsafeWindow?.woocommerce_params) {
            GM_openInTab(`${window.location.origin}/wp-admin/admin.php?page=wc-admin`, { active: true });
          }
          break;

        case '3': // Edit product
          e.preventDefault();
          if (window.unsafeWindow?.Shopify) {
            const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
            if (page?.pageType === 'product') {
              GM_openInTab(`${window.location.origin}/admin/products/${page.resourceId}`, { active: true });
            }
          } else if (window.unsafeWindow?.BCData) {
            const bcStoreId = document.querySelector("head link[rel='dns-prefetch preconnect'][href*='.bigcommerce.com/s-']")?.href?.split('s-')[1];
            const productId = document.querySelector('input[name=product_id]')?.value;
            if (bcStoreId && productId) {
              GM_openInTab(`https://store-${bcStoreId}.mybigcommerce.com/manage/products/${productId}/edit`, { active: true });
            }
          } else if (window.unsafeWindow?.woocommerce_params) {
            const productId = window.unsafeWindow?.cm_product?.[0] ?? window.unsafeWindow?.document.querySelector('button[name="add-to-cart"]')?.value;
            if (productId) {
              GM_openInTab(`${window.location.origin}/wp-admin/post.php?post=${productId}&action=edit`, { active: true });
            }
          }
          break;

        case '4': // Edit collection
          if (window.unsafeWindow?.Shopify) {
            const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
            if (page?.pageType === 'collection') {
              e.preventDefault();
              GM_openInTab(`${window.location.origin}/admin/collections/${page.resourceId}`, { active: true });
            }
          }
          break;

        case '5': // Fitment chart
          {
            const productId = window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId;
            const isFitmentSearch = !!window.unsafeWindow?.Convermax?.templates?.config?.fitmentSearchConfig?.fields?.length;
            if (storeId && isFitmentSearch && productId) {
              e.preventDefault();
              GM_openInTab(`https://${storeId}.myconvermax.com/ymm/fitments.html?productId=${productId}&includeSource=true`, { active: true });
            }
          }
          break;
          
        case '6': // Vehicle info
          if (storeId && window.unsafeWindow?.Convermax?.isVehicleSelected?.()) {
            e.preventDefault();
            const url = new URL(`https://${storeId}.myconvermax.com/ymm/vehicleinfo.html`);
            for (const [key, value] of Object.entries(window.unsafeWindow?.Convermax?.getVehicle())) {
              url.searchParams.set(key, value);
            }
            GM_openInTab(url.href, { active: true });
          }
          break;
      }
    }
  });
}

(function () {
  'use strict';

  bypassShopifyPassword();

  ensureContextIsSet(() => window.unsafeWindow?.Convermax?.initialized, 10000).then(function () {
    registerConvermaxAdminMenuCommand();
    registerFitmentsMenuCommand();
    registerHotkeys();
  });

  ensureContextIsSet(
    () =>
      window.unsafeWindow?.Shopify || window.unsafeWindow?.BCData || window.unsafeWindow?.woocommerce_params,
    10000,
  ).then(function () {
    registerPlatformAdminMenuCommand();
  });

  const url = window.location.href;
  if (url.startsWith('https://admin.shopify.com/store/')) {
    ensureContextIsSet(() => fixNoAccessToShopifyAdmin(), 10000);
  }
  if (url.startsWith('https://partners.shopify.com/201897/stores?search_value=')) {
    ensureContextIsSet(() => fixNoStoreAtShopifyPartners(), 10000);
  }
})();
