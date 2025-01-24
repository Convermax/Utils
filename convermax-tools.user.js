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
// @grant        GM_setClipboard 
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @sandbox      JavaScript
// ==/UserScript==
/* eslint-disable no-console, no-undef, camelcase */

function getPlatform(platform = null) {
  if (platform === 'shopify' || window.unsafeWindow?.Shopify) {
    return 'shopify';
  } else if (platform === 'bigcommerce' || window.unsafeWindow?.BCData) {
    return 'bigcommerce';
  } else if (platform === 'woocommerce' || window.unsafeWindow?.woocommerce_params) {
    return 'woocommerce';
  } else if (platform === 'convermax') {
    return 'convermax';
  }
  return null;
}

function getStoreId(platform = null) {
  if (platform === 'bigcommerce' || window.unsafeWindow?.BCData) {
    return document.querySelector("head link[rel='dns-prefetch preconnect'][href*='.bigcommerce.com/s-']")
        ?.href?.split('s-')[1];
  } else {
    const url = window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.serverUrl;
    return url?.replace('https://', '').replace('.myconvermax.com', '').replace('client.convermax.com/', '');
  }
}
function getProductId(platform = null) {
  const platformHandlers = {
    shopify: () => window.unsafeWindow?.ShopifyAnalytics?.meta?.page?.resourceId,
    bigcommerce: () => document.querySelector('input[name=product_id]')?.value,
    woocommerce: () => window.unsafeWindow?.cm_product?.[0] || document.querySelector('button[name="add-to-cart"]')?.value,
    convermax: () => window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId,
  };

  return platformHandlers[getPlatform(platform)]?.() || null;
}

const actions = {
  shopify: {
    admin: {
      label: 'Shopify Themes',
      action: () => GM_openInTab(`${window.location.origin}/admin/themes`, { active: true }),
    },
    product: {
      label: 'Shopify Product',
      action: (resourceId) =>
          GM_openInTab(`${window.location.origin}/admin/products/${resourceId}`, { active: true }),
    },
    collection: {
      label: 'Shopify Collection',
      action: (resourceId) =>
          GM_openInTab(`${window.location.origin}/admin/collections/${resourceId}`, { active: true }),
    },
  },
  bigcommerce: {
    admin: {
      label: 'BigCommerce Admin',
      action: (storeId) => GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage`, { active: true }),
    },
    product: {
      label: 'BigCommerce Product',
      action: (storeId, productId) =>
          GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage/products/${productId}/edit`, {
            active: true,
          }),
    },
    categories: {
      label: 'BigCommerce Categories',
      action: (storeId) =>
          GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage/products/categories`, {
            active: true,
          }),
    },
  },
  woocommerce: {
    admin: {
      label: 'WooCommerce Admin',
      action: () => GM_openInTab(`${window.location.origin}/wp-admin/admin.php?page=wc-admin`, { active: true }),
    },
    product: {
      label: 'WooCommerce Product',
      action: (productId) =>
          GM_openInTab(`${window.location.origin}/wp-admin/post.php?post=${productId}&action=edit`, {
            active: true,
          }),
    },
    categoryProducts: {
      label: 'WooCommerce Category Products',
      action: (categoryHandle) =>
          GM_openInTab(
              `${window.location.origin}/wp-admin/edit.php?product_cat=${categoryHandle}&post_type=product`,
              { active: true },
          ),
    },
    category: {
      label: 'WooCommerce Category (see 1st)',
      action: (categoryName) =>
          GM_openInTab(
              `${window.location.origin}/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product&s=${categoryName.replace(' ', '+')}`,
              { active: true },
          ),
    },
  },
  convermax: {
    admin: {
      label: 'Convermax Admin',
      action: (storeId) => GM_openInTab(`https://myconvermax.com/${storeId}/status`, { active: true }),
    },
  },
  fitment: {
    fitmentChart: {
      label: 'Fitment Chart',
      action: (storeId, productId) =>
          GM_openInTab(
              `https://${storeId}.myconvermax.com/ymm/fitments.html?productId=${productId}&includeSource=true`,
              { active: true },
          ),
    },
    vehicleInfo: {
      label: 'Vehicle Info',
      action: (storeId, vehicle) => {
        const url = new URL(`https://${storeId}.myconvermax.com/ymm/vehicleinfo.html`);
        for (const [key, value] of Object.entries(vehicle)) {
          url.searchParams.set(key, value);
        }
        GM_openInTab(url.href, { active: true });
      },
    },
  },
}

function registerMenuCommands(commands) {
  commands.forEach(({ label, action }) => GM_registerMenuCommand(label, action));
}

function registerConvermaxAdminMenuCommand() {
  const storeId = getStoreId();
  if (storeId) {
    registerMenuCommands([
      {
        label: actions.convermax.admin.label,
        action: () => actions.convermax.admin.action(storeId),
      },
    ]);
  }
}

function registerPlatformAdminMenuCommand() {
  const platform = getPlatform();
  const storeId = getStoreId();
  const productId = getProductId();
  const commands = [];

  const platformHandlers = {
    shopify: () => {
      commands.push(actions.shopify.themes);

      const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
      if (page?.pageType === 'product') {
        commands.push({
          ...actions.shopify.product,
          action: () => actions.shopify.product.action(page.resourceId),
        });
      } else if (page?.pageType === 'collection') {
        commands.push({
          ...actions.shopify.collection,
          action: () => actions.shopify.collection.action(page.resourceId),
        });
      }
    },

    bigcommerce: () => {
      if (storeId) {
        commands.push({
          ...actions.bigcommerce.admin,
          action: () => actions.bigcommerce.admin.action(storeId),
        });
        
        commands.push({
          ...actions.bigcommerce.categories,
          action: () => actions.bigcommerce.categories.action(storeId),
        })

        if (productId) {
          commands.push({
            ...actions.bigcommerce.product,
            action: () => actions.bigcommerce.product.action(storeId, productId),
          });
        }
      }
    },

    woocommerce: () => {
      commands.push(actions.woocommerce.admin);

      if (productId) {
        commands.push({
          ...actions.woocommerce.product,
          action: () => actions.woocommerce.product.action(productId),
        });
      }

      const categoryHandle = window.location.pathname.includes('/product-category/')
          ? window.location.pathname.replace('/product-category/', '')
          : '';
      if (categoryHandle) {
        commands.push({
          ...actions.woocommerce.categoryProducts,
          action: () => actions.woocommerce.categoryProducts.action(categoryHandle),
        });
      }

      const categoryName = window.unsafeWindow?.cm_category;
      if (categoryName) {
        commands.push({
          ...actions.woocommerce.categorySettings,
          action: () => actions.woocommerce.categorySettings.action(categoryName),
        });
      }
    },
  };

  platformHandlers[platform]?.();

  registerMenuCommands(commands);
}

function registerFitmentsMenuCommand() {
  const storeId = getStoreId();
  const productId = getProductId("convermax")
  const isFitmentSearch = !!window.unsafeWindow?.Convermax?.templates?.config?.fitmentSearchConfig?.fields?.length;
  const commands = [];

  if (!storeId || !isFitmentSearch) return;

  if (productId) {
    commands.push({
      label: actions.fitment.fitmentChart.label,
      action: () => actions.fitment.fitmentChart.action(storeId, productId),
    });
  }

  commands.push({
    label: actions.fitment.vehicleInfo.label,
    action: () => {
      if (window.unsafeWindow?.Convermax?.isVehicleSelected()) {
        const vehicle = window.unsafeWindow?.Convermax?.getVehicle();
        actions.fitment.vehicleInfo.action(storeId, vehicle);
      } else {
        alert('Convermax Tools: No vehicle selected!');
      }
    },
  });

  registerMenuCommands(commands);
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
  document.addEventListener('keydown', (e) => {
    const platform = getPlatform();
    const storeId = getStoreId(platform);
    const productId = getProductId();
    
    if (e.ctrlKey && !e.altKey && !e.shiftKey && e.key === '`') {
      if (storeId) {
        e.preventDefault();
        GM_setClipboard(storeId);
      } else {
        alert('Store ID is not defined');
      }
    }
    
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
      switch (e.key) {
        case '1': // Convermax admin
          if (storeId) {
            e.preventDefault();
            actions.convermax.admin.action(storeId);
          }
          break;

        case '2': // Platform admin
          e.preventDefault();
          if (platform === 'shopify') {
            actions.shopify.admin.action();
          } else if (platform === 'bigcommerce') {
            actions.bigcommerce.admin.action(storeId);
          }
          else if (platform === 'woocommerce') {
            actions.woocommerce.admin.action();
          }
          break;

        case '3': // Edit product
          e.preventDefault();
          if (platform === 'shopify') {
            const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
            if (page?.pageType === 'product') {
              actions.shopify.product.action(page.resourceId);
            }
          } else if (platform === 'bigcommerce' && storeId && productId) {
            actions.bigcommerce.product.action(storeId, productId);
          } else if (platform === 'woocommerce' && productId) {
            actions.woocommerce.product.action(productId);
          }
          break;

        case '4': // Edit collection
          if (platform === 'shopify') {
            const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
            if (page?.pageType === 'collection') {
              e.preventDefault();
              actions.shopify.collection.action(page.resourceId);
            }
          } else if (platform === 'bigcommerce' && storeId) {
            actions.bigcommerce.categories.action(storeId);
          } else if (platform === 'woocommerce') {
            const categoryName = window.unsafeWindow?.cm_category;
            if (categoryName) {
              actions.woocommerce.category.action(categoryName);
            }
          }
          break;

        case '5': // Fitment chart
          if (storeId && productId) {
            e.preventDefault();
            actions.fitment.fitmentChart.action(storeId, productId);
          }
          break;

        case '6': // Vehicle info
          if (storeId && window.unsafeWindow?.Convermax?.isVehicleSelected?.()) {
            e.preventDefault();
            const vehicle = window.unsafeWindow?.Convermax?.getVehicle();
            actions.fitment.vehicleInfo.action(storeId, vehicle);
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
