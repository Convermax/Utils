// ==UserScript==
// @name         Convermax Tools
// @namespace    convermax-dev
// @version      0.8.0
// @description  Convermax Tools
// @downloadURL  https://github.com/Convermax/Utils/raw/main/convermax-tools.user.js
// @updateURL    https://github.com/Convermax/Utils/raw/main/convermax-tools.user.js
// @author       Miha_xXx & ArtyomPeterson
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

const platforms = {
  shopify: {
    test: () => window.unsafeWindow?.Shopify || window.location.origin === "https://admin.shopify.com",
    get page() {
      return window.unsafeWindow?.ShopifyAnalytics?.meta?.page || null;
    },
    general: [
      {
        label: 'Shopify Themes [Alt + 2]',
        hotkey: '2',
        order: 2,
        action: () => GM_openInTab(`${window.location.origin}/admin/themes`, { active: true })
      },
      {
        label: 'Shopify All Collections',
        action: () => GM_openInTab(`${window.location.origin}/admin/collections`, { active: true })
      }
    ],
    resources: [
      {
        test: () => platforms.shopify.page && platforms.shopify.page.resourceId && platforms.shopify.page.pageType === 'product',
        actions: [
          {
            label: 'Shopify Product [Alt + 3]',
            hotkey: '3',
            order: 3,
            action: () => GM_openInTab(`${window.location.origin}/admin/products/${platforms.shopify.page.resourceId}`, { active: true })
          }
        ]
      },
      {
        test: () => platforms.shopify.page && platforms.shopify.page.resourceId && platforms.shopify.page.pageType === 'collection',
        actions: [
          {
            label: 'Shopify Collection [Alt + 3]',
            hotkey: '3',
            order: 3,
            action: () => GM_openInTab(`${window.location.origin}/admin/collections/${platforms.shopify.page.resourceId}`, { active: true })
          }
        ]
      }
    ]
  },
  bigcommerce: {
    test: () => window.unsafeWindow?.BCData && platforms.bigcommerce.storeHash,
    _bcAdminBarParams: (() => {
      const match = document.documentElement.innerHTML.match(/window\.bcAdminBar\(([^)]+)\)/);
      return match ? match[1].replace(/{.*?}/g, '{}').split(',').map(arg => arg.trim().replace(/^['"]|['"]$/g, '')) : null;
    })(),
    get storeHash() {
      return document
        .querySelector("head link[href*='.bigcommerce.com/s-']")
        ?.href?.split('s-')[1] || null;
    },
    get productId() {
      return document.querySelector('input[name=product_id]')?.value ||
        window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId ||
        null;
    },
    get channelId() {
      return this._bcAdminBarParams ? this._bcAdminBarParams[1] : null;
    },
    get categoryId() {
      return this._bcAdminBarParams ? this._bcAdminBarParams[4] : null;
    },
    general: [
      {
        label: 'BigCommerce Admin [Alt + 2]',
        hotkey: '2',
        order: 2,
        action: () => GM_openInTab(`https://store-${platforms.bigcommerce.storeHash}.mybigcommerce.com/manage`, { active: true })
      },
      {
        label: 'BigCommerce All Categories',
        action: () => GM_openInTab(`https://store-${platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/products/categories`, { active: true })
      }
    ],
    resources: [
      {
        test: () => platforms.bigcommerce.storeHash && platforms.bigcommerce.productId,
        actions: [
          {
            label: 'BigCommerce Product [Alt + 3]',
            hotkey: '3',
            order: 3,
            action: () => GM_openInTab(`https://store-${platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/products/edit/${platforms.bigcommerce.productId}`, { active: true })
          }
        ]
      },
      {
        test: () => platforms.bigcommerce.storeHash && platforms.bigcommerce.categoryId && platforms.bigcommerce.channelId,
        actions: [
          {
            label: 'BigCommerce Category [Alt + 3]',
            hotkey: '3',
            order: 3,
            action: () => GM_openInTab(`https://store-${platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/products/categories/${platforms.bigcommerce.channelId}/edit/${platforms.bigcommerce.categoryId}`, { active: true })
          }
        ]
      }
    ]
  },
  woocommerce: {
    test: () => window.unsafeWindow?.woocommerce_params,
    get productId() {
      return window.unsafeWindow?.cm_product?.[0] ||
        document.querySelector('button[name="add-to-cart"]')?.value ||
        window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId ||
        null;
    },
    get categoryName() {
      return window.unsafeWindow?.cm_category;
    },
    get categoryHandle() {
      return window.location.pathname.includes('/product-category/')
        ? window.location.pathname.replace('/product-category/', '')
        : '';
    },
    general: [
      {
        label: 'WooCommerce Admin [Alt + 2]',
        hotkey: '2',
        order: 2,
        action: () => GM_openInTab(`${window.location.origin}/wp-admin/admin.php?page=wc-admin`, { active: true })
      },
      {
        label: 'WooCommerce All Categories',
        action: () => GM_openInTab(`${window.location.origin}/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product`, { active: true })
      }
    ],
    resources: [
      {
        test: () => platforms.woocommerce.productId,
        actions: [
          {
            label: 'WooCommerce Product [Alt + 3]',
            hotkey: '3',
            order: 3,
            action: () => GM_openInTab(`${window.location.origin}/wp-admin/post.php?post=${platforms.woocommerce.productId}&action=edit`, { active: true })
          }
        ]
      },
      {
        test: () => platforms.woocommerce.categoryName,
        actions: [
          {
            label: 'WooCommerce Category [Alt + 3]',
            hotkey: '3',
            order: 3,
            action: () => GM_openInTab(`${window.location.origin}/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product&s=${platforms.woocommerce.categoryName.replace(' ', '+')}`, { active: true })
          }
        ]
      },
      {
        test: () => platforms.woocommerce.categoryHandle,
        actions: [
          {
            label: 'WooCommerce Category Products',
            action: () => GM_openInTab(`${window.location.origin}/wp-admin/edit.php?product_cat=${platforms.woocommerce.categoryHandle}&post_type=product`, { active: true })
          }
        ]
      }
    ]
  },
  shift4shop: {
    test: () => window.unsafeWindow?._3d_cart,
    get productId() {
      return window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId ||
        null;
    },
    get catalogId() { // both products and categories have catalog ID
      return window.unsafeWindow?.catID || null
    },
    get securityToken() {
      return new Promise(async (resolve, reject) => {
        const storeUrl = window.location.origin;
        const tokenKey = `shift4shop_security_token_${storeUrl}`;
        const timestampKey = `shift4shop_token_timestamp_${storeUrl}`;

        const cachedToken = GM_getValue(tokenKey);
        const tokenTimestamp = GM_getValue(timestampKey);
        const tokenExpiry = 24 * 60 * 60 * 1000;
        if (cachedToken && tokenTimestamp && (Date.now() - tokenTimestamp < tokenExpiry)) {
          return resolve(cachedToken);
        }

        GM_xmlhttpRequest({
          method: "GET",
          url: `${storeUrl}/admin/category_view.asp`,
          onload: function(response) {
            const tokenMatch = response.responseText.match(/hdnSecurityToken=([^&]+)/);
            if (tokenMatch && tokenMatch[1]) {
              GM_setValue(tokenKey, tokenMatch[1]);
              GM_setValue(timestampKey, Date.now());
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
    },
    general: [
      {
        label: 'Shift4Shop Admin [Alt + 2]',
        hotkey: '2',
        order: 2,
        action: () => GM_openInTab(`${window.location.origin}/admin/admin-home.asp`, { active: true })
      },
      {
        label: 'Shift4Shop All Categories',
        action: () => GM_openInTab(`${window.location.origin}/admin/category_view.asp`, { active: true })
      }
    ],
    resources: [
      {
        test: () => platforms.shift4shop.productId,
        actions: [
          {
            label: 'Shift4Shop Product [Alt + 3]',
            hotkey: '3',
            order: 3,
            action: () => GM_openInTab(`${window.location.origin}/admin/iteminfo.asp?catid=${platforms.shift4shop.productId}&pannel=1`, { active: true }),
          }
        ]
      },
      {
        test: () => !platforms.shift4shop.productId && !isNaN(platforms.shift4shop.catalogId),
        actions: (() => {
          return [
            {
              label: 'Shift4Shop Category [Alt + 3]',
              hotkey: '3',
              order: 3,
              action: async () => {
                try {
                  const securityToken = await platforms.shift4shop.securityToken;
                  GM_openInTab(`${window.location.origin}/admin/category_view.asp?action=options&hdnSecurityToken=${securityToken}&catid=${platforms.shift4shop.catalogId}`, {active: true});
                } catch (error) {
                  alert('Failed to get security token\nTry to log in to the store manager');
                  console.error('Failed to get security token:', error);
                }
              }
            }
          ];
        })(),
      }
    ],
  },
  common: {
    test: () => platforms.common.storeId,
    get storeId() {
      return window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.serverUrl
        ?.replace('https://', '')
        ?.replace('.myconvermax.com', '')
        ?.replace('client.convermax.com/', '') || null;
    },
    get productId() {
      return window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId || null;
    },
    get isFitmentSearch() {
      return !!window.unsafeWindow?.Convermax?.templates?.config?.fitmentSearchConfig?.fields?.length;
    },
    get vehicle() {
      return window.unsafeWindow?.Convermax?.getVehicle();
    },
    general: [
      {
        label: 'Convermax Admin [Alt + 1]',
        hotkey: '1',
        order: 1,
        action: () => GM_openInTab(`https://myconvermax.com/${platforms.common.storeId}/status`, { active: true })
      },
      {
        hotkey: '`',
        ctrlKey: true,
        action: () => GM_setClipboard(platforms.common.storeId)
      }
    ],
    resources: [
      {
        test: () => platforms.common.storeId && platforms.common.isFitmentSearch && platforms.common.productId,
        actions: [
          {
            label: 'Fitment Chart [Alt + 4]',
            hotkey: '4',
            order: 4,
            action: () => GM_openInTab(`https://${platforms.common.storeId}.myconvermax.com/ymm/fitments.html?productId=${platforms.common.productId}&includeSource=true`, { active: true })
          }
        ]
      },
      {
        test: () => platforms.common.storeId && platforms.common.isFitmentSearch,
        actions: [
          {
            label: 'Vehicle Info [Alt + 5]',
            hotkey: '5',
            order: 5,
            action: () => {
              if (window.unsafeWindow?.Convermax?.isVehicleSelected()) {
                const vehicle = platforms.common.vehicle;
                const url = new URL(`https://${platforms.common.storeId}.myconvermax.com/ymm/vehicleinfo.html`);
                for (const [key, value] of Object.entries(vehicle)) {
                  url.searchParams.set(key, value);
                }
                GM_openInTab(url.href, { active: true });
              } else {
                alert('Convermax Tools: No vehicle selected!');
              }
            }
          }
        ]
      }
    ]
  }
}

async function registerCommandsAndHotKeys() {
  const commands = [];

  Object.values(platforms).forEach(platform => {
    if (platform.test && !platform.test()) return;
    platform.general.forEach(action => commands.push(action));
    platform.resources.forEach(resource => {
      if (resource.test && !resource.test()) return;
      resource.actions.forEach(action => commands.push(action));
    });
  });

  commands
    .filter(({ label }) => label)
    .sort((a, b) => (a.order || 9) - (b.order || 9))
    .forEach(({ label, action }) => GM_registerMenuCommand(label, action));
  commands
    .filter(({ hotkey }) => hotkey)
    .forEach(({ hotkey, ctrlKey, action }) => {
      document.addEventListener('keydown', (e) => {
        if (!e.shiftKey && e.key === hotkey &&
          (ctrlKey && e.ctrlKey && !e.altKey || !ctrlKey && !e.ctrlKey && e.altKey)) {
          e.preventDefault();
          action();
        }
      });
    });
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

function setupPermissionsButton() {
  const requiredPermissions = [
    'products',
    'manage_products',
    'manage_inventory',
    'delete_products',
    'metaobject_definitions_view',
    'metaobjects_view',
    'metaobject_definitions_edit',
    'metaobjects_edit',
    'metaobject_definitions_delete',
    'metaobjects_delete',
    'applications', 'themes',
    'edit_theme_code',
    'pages',
    'links'
  ];

  const targetButton = document.querySelector('#create-new-store-button');

  const button = document.createElement('button');
  button.textContent = 'Select permissions';
  button.className = 'Polaris-Button Polaris-Button--primary';
  button.style.marginLeft = '10px';
  button.setAttribute('type', 'button');

  button.addEventListener('click', () => {
    requiredPermissions.forEach(permission => {
      const checkbox = document.querySelector(`input#${permission}.Polaris-Checkbox__Input`);
      if (checkbox && !checkbox.checked) {
        checkbox.click();
      }
    });

    const textArea = document.querySelector('textarea#PolarisTextField2');
    if (textArea) {
      textArea.value = 'Convermax Team: Requesting access to help you with our app.';
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  targetButton.parentNode.insertBefore(button, targetButton.nextSibling);
}

(function () {
  'use strict';

  bypassShopifyPassword();

  ensureContextIsSet(() =>
    window.unsafeWindow?.Shopify || window.unsafeWindow?.BCData || window.unsafeWindow?.woocommerce_params || window.unsafeWindow?._3d_cart,
    10000
  ).then(async function () {
    await registerCommandsAndHotKeys();
  });

  const url = window.location.href;
  if (url.startsWith('https://admin.shopify.com/store/')) {
    ensureContextIsSet(() => fixNoAccessToShopifyAdmin(), 10000);
  }
  if (url.startsWith('https://partners.shopify.com/201897/stores?search_value=')) {
    ensureContextIsSet(() => fixNoStoreAtShopifyPartners(), 10000);
  }
  if (url.startsWith('https://partners.shopify.com/')) {
    ensureContextIsSet(() => document.querySelector('#create-new-store-button'), 10000).then(function() {
      setupPermissionsButton();
    });
  }
})();
