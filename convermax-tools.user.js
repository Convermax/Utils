// ==UserScript==
// @name         Convermax Tools
// @namespace    convermax-dev
// @version      0.8.0
// @description  Convermax Tools
// @downloadURL  https://github.com/Convermax/Utils/raw/main/convermax-tools.user.js
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-tools.user.js
// @author       Miha_xXx
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=convermax.com
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @sandbox      JavaScript
// ==/UserScript==
/* eslint-disable no-console, no-undef, camelcase */

function getPlatform() {
  if (window.unsafeWindow?.Shopify) {
    return 'shopify';
  }
  if (window.unsafeWindow?.BCData) {
    return 'bigcommerce';
  }
  if (window.unsafeWindow?.woocommerce_params) {
    return 'woocommerce';
  }
  if (window.unsafeWindow?._3d_cart) {
    return 'shift4shop'
  }
  return null;
}

function getStoreId(getNativeStoreId = null) {
  if (getNativeStoreId) {
    const platform = getPlatform();
    if (platform === 'shopify') {
      return window.Shopify?.shop?.replace('.myshopify.com', '') || null;
    }
    if (platform === 'bigcommerce') {
      return document
          .querySelector("head link[rel='dns-prefetch preconnect'][href*='.bigcommerce.com/s-']")
          ?.href?.split('s-')[1] || null;
    }
    return null;
  }

  return window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.storeId || null;
}

function getProductId() {
  const productId = window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId;
  if (productId) return productId;

  const platform = getPlatform();
  if (!platform) return null;

  const platformHandlers = {
    shopify: () => {
      const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
      return page?.pageType === 'product' ? page.resourceId || null : null;
    },
    bigcommerce: () => document.querySelector('input[name=product_id]')?.value || null,
    woocommerce: () => window.unsafeWindow?.cm_product?.[0] || document.querySelector('button[name="add-to-cart"]')?.value || null,
    shift4shop: () => window.unsageWindow?._3d_item?.catalogid || null,
  }
  return platformHandlers[platform]?.() || null;
}

function registerMenuCommands(commands) {
  commands.forEach(({ label, action }) => GM_registerMenuCommand(label, action));
}

const actions = {
  convermax: {
    admin: (storeId) => ({
      label: 'Convermax Admin [Alt + 1]',
      action: () => GM_openInTab(`https://myconvermax.com/${storeId}/status`, { active: true }),
    }),
  },
  shopify: {
    admin: {
      label: 'Shopify Themes [Alt + 2]',
      action: () => GM_openInTab(`${window.location.origin}/admin/themes`, { active: true }),
    },
    product: (resourceId) => ({
      label: 'Shopify Product [Alt + 3]',
      action: () => GM_openInTab(`${window.location.origin}/admin/products/${resourceId}`, { active: true }),
    }),
    collection: (resourceId) => ({
      label: 'Shopify Collection [Alt + 3]',
      action: () => GM_openInTab(`${window.location.origin}/admin/collections/${resourceId}`, { active: true }),
    }),
  },
  bigcommerce: {
    admin: (storeId) => ({
      label: 'BigCommerce Admin [Alt + 2]',
      action: () => GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage`, { active: true }),
    }),
    product: (storeId, productId) => ({
      label: 'BigCommerce Product [Alt + 3]',
      action: () =>
          GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage/products/${productId}/edit`, {
            active: true,
          }),
    }),
    categories: (storeId, customLabel = null) => ({
      label: customLabel || 'BigCommerce Categories [Alt + 3]',
      action: () =>
          GM_openInTab(`https://store-${storeId}.mybigcommerce.com/manage/products/categories`, {
            active: true,
          }),
    }),
  },
  woocommerce: {
    admin: {
      label: 'WooCommerce Admin [Alt + 2]',
      action: () => GM_openInTab(`${window.location.origin}/wp-admin/admin.php?page=wc-admin`, { active: true }),
    },
    product: (productId) => ({
      label: 'WooCommerce Product [Alt + 3]',
      action: () =>
          GM_openInTab(`${window.location.origin}/wp-admin/post.php?post=${productId}&action=edit`, {
            active: true,
          }),
    }),
    categoryProducts: (categoryHandle) => ({
      label: 'WooCommerce Category Products',
      action: () =>
          GM_openInTab(
              `${window.location.origin}/wp-admin/edit.php?product_cat=${categoryHandle}&post_type=product`,
              { active: true },
          ),
    }),
    category: (categoryName) => ({
      label: 'WooCommerce Category [Alt + 3]',
      action: () =>
          GM_openInTab(
              `${window.location.origin}/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product&s=${categoryName.replace(' ', '+')}`,
              { active: true },
          ),
    }),
  },
  shift4shop: {
    admin: {
      label: 'Shift4Shop Admin [Alt + 2]',
      action: () => GM_openInTab(`${window.location.origin}/admin/admin-home.asp`, { active: true }),
    },
    product: (productId) => ({
      label: 'Shift4Shop Product [Alt + 3]',
      action: () =>
          GM_openInTab(`${window.location.origin}/admin/iteminfo.asp?catid=${productId}&pannel=1`, {
            active: true,
          }),
    }),
    category: (categoryId, customLabel = null) => ({
      label: customLabel || 'Shift4Shop Category [Alt + 3]',
      action: async () => {
        try {
          const securityToken = await getShift4ShopSecurityToken();
          GM_openInTab(
              `${window.location.origin}/admin/category_view.asp?action=options&hdnSecurityToken=${securityToken}&catid=${categoryId}`,
              {active: true},
          )
        } catch (error) {
          alert('Failed to get security token');
          console.error('Failed to get security token:', error);
        }
      }
    }),
  },
  fitment: {
    fitmentChart: (storeId, productId) => ({
      label: 'Fitment Chart [Alt + 4]',
      action: () =>
          GM_openInTab(
              `https://${storeId}.myconvermax.com/ymm/fitments.html?productId=${productId}&includeSource=true`,
              { active: true },
          ),
    }),
    vehicleInfo: (storeId) => ({
      label: 'Vehicle Info [Alt + 5]',
      action: () => {
        if (window.unsafeWindow?.Convermax?.isVehicleSelected()) {
          const vehicle = window.unsafeWindow?.Convermax?.getVehicle();
          const url = new URL(`https://${storeId}.myconvermax.com/ymm/vehicleinfo.html`);
          for (const [key, value] of Object.entries(vehicle)) {
            url.searchParams.set(key, value);
          }
          GM_openInTab(url.href, {active: true});
        } else {
          alert('Convermax Tools: No vehicle selected!');
        }
      },
    }),
  },
}

function registerConvermaxAdminMenuCommand() {
  const storeId = getStoreId();
  if (storeId) {
    registerMenuCommands([
      actions.convermax.admin(storeId),
    ]);
  }
}

async function registerPlatformAdminMenuCommand() {
  const storeId = getStoreId();
  const nativeStoreId = getStoreId(true);
  const productId = getProductId();
  const commands = [];

  const platformHandlers = {
    shopify: () => {
      const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
      
      commands.push(actions.shopify.admin);
      if (page.resourceId) {
        if (page?.pageType === 'product') {
          commands.push(actions.shopify.product(page.resourceId));
        }
        if (page?.pageType === 'collection') {
          commands.push(actions.shopify.collection(page.resourceId));
        }
      }
    },

    bigcommerce: () => {
      commands.push(actions.bigcommerce.admin(storeId));
      if (nativeStoreId) {
        if (productId) {
          commands.push(actions.bigcommerce.product(nativeStoreId, productId));
        }

        commands.push(
          !!productId
            ? actions.bigcommerce.categories(nativeStoreId, "BigCommerce Categories")
            : actions.bigcommerce.categories(nativeStoreId)
        );
      }
    },

    woocommerce: () => {
      const categoryName = window.unsafeWindow?.cm_category;
      const categoryHandle = window.location.pathname.includes('/product-category/')
        ? window.location.pathname.replace('/product-category/', '')
        : '';
      
      commands.push(actions.woocommerce.admin);
      if (productId) {
        commands.push(actions.woocommerce.product(storeId));
      }
      if (categoryHandle) {
        commands.push(actions.woocommerce.categoryProducts(categoryHandle));
      }
      if (categoryName) {
        commands.push(actions.woocommerce.category(categoryName));
      }
    },

    shift4shop: async () => {
      const categoryId = window.unsafeWindow?.catID;

      commands.push(actions.shift4shop.admin);
      if (productId) {
        commands.push(actions.shift4shop.product(productId));
      }
      if (!isNaN(categoryId)) {
        commands.push(
          !!productId
            ? actions.shift4shop.category(categoryId, "Shift4Shop Category")
            : actions.shift4shop.category(categoryId)
        );
        }
      }
    }
  }

  const platformHandler = platformHandlers[getPlatform()];
  if (platformHandler) {
    await platformHandler();
  }

  registerMenuCommands(commands);
}

function registerFitmentsMenuCommand() {
  const storeId = getStoreId();
  const productId = getProductId()
  const isFitmentSearch = !!window.unsafeWindow?.Convermax?.templates?.config?.fitmentSearchConfig?.fields?.length;
  const commands = [];

  if (!storeId || !isFitmentSearch) return;

  if (productId) {
    actions.fitment.fitmentChart(storeId, productId);
  }

  commands.push(actions.fitment.vehicleInfo(storeId));

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

function getShift4ShopSecurityToken() {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${window.location.origin}/admin/category_view.asp`,
      onload: function(response) {
        const tokenMatch = response.responseText.match(/hdnSecurityToken=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          resolve(tokenMatch[1]);
        } else {
          reject(new Error('Security token not found in the response.'));
        }
      },
      onerror: function(error) {
        reject(error);
      }
    });
  });
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
    const storeId = getStoreId();
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
          } else if (platform === 'bigcommerce' && storeId) {
            actions.bigcommerce.admin.action(storeId);
          } else if (platform === 'woocommerce') {
            actions.woocommerce.admin.action();
          } else if (platform === 'shift4shop') {
            actions.shift4shop.admin.action();
          }
          break;

        case '3': // Edit product/collection
          e.preventDefault();
          if (platform === 'shopify') {
            const page = window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
            if (page?.pageType === 'product' && page.resourceId) {
              actions.shopify.product(page.resourceId).action();
            } else if (page?.pageType === 'collection' && page.resourceId) {
              actions.shopify.collection(page.resourceId).action();
            }
          } else if (platform === 'bigcommerce' && storeId) {
            if (productId) {
              actions.bigcommerce.product.action(storeId, productId);
            } else {
              actions.bigcommerce.categories.action(storeId);
            }
          } else if (platform === 'woocommerce') {
            const categoryName = window.unsafeWindow?.cm_category;
            if (productId) {
              actions.woocommerce.product.action(productId);
            } else if (categoryName) {
              actions.woocommerce.category.action(categoryName);
            }
          } else if (platform === 'shift4shop') {
            const categoryId = window.unsafeWindow?.catID;
            if (productId) {
              actions.shift4shop.product.action(productId);
            } else if (categoryId !== "[catid]") {
              getShift4ShopSecurityToken().then(securityToken => {
                actions.shift4shop.category.action(securityToken, categoryId);
              }).catch(error => {
                console.error('Failed to get security token:', error);
              });
            }
          }
          break;

        case '4': // Fitment chart
          if (storeId && productId) {
            e.preventDefault();
            actions.fitment.fitmentChart.action(storeId, productId);
          }
          break;

        case '5': // Vehicle info
          if (storeId && window.unsafeWindow?.Convermax?.isVehicleSelected?.()) {
            e.preventDefault();
            actions.fitment.vehicleInfo.action(storeId);
          }
          break;
      }
    }
  });
}

(function () {
  'use strict';

  bypassShopifyPassword();

  ensureContextIsSet(() => window.unsafeWindow?.Convermax?.initialized, 10000).then(async function () {
    registerConvermaxAdminMenuCommand();
    await registerPlatformAdminMenuCommand();
    registerFitmentsMenuCommand();
    registerHotkeys();
  });

  const url = window.location.href;
  if (url.startsWith('https://admin.shopify.com/store/')) {
    ensureContextIsSet(() => fixNoAccessToShopifyAdmin(), 10000);
  }
  if (url.startsWith('https://partners.shopify.com/201897/stores?search_value=')) {
    ensureContextIsSet(() => fixNoStoreAtShopifyPartners(), 10000);
  }
})();
