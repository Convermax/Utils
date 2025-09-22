// ==UserScript==
// @name         Convermax Tools
// @namespace    convermax-dev
// @version      0.9.13
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
// @noframes
// ==/UserScript==
/* eslint-disable no-console, no-undef, camelcase */

const actions = {
  platforms: {
    shopify: {
      test: () =>
        window.unsafeWindow?.Shopify ||
        window.location.origin.endsWith('.myshopify.com') ||
        window.location.origin === 'https://admin.shopify.com',
      get page() {
        return window.unsafeWindow?.ShopifyAnalytics?.meta?.page;
      },
      get storeId() {
        return window.unsafeWindow?.Shopify.shop.replace('.myshopify.com', '');
      },
      general: [
        {
          label: 'Shopify Themes',
          hotkey: '1',
          order: 1,
          action: () =>
            GM_openInTab(`https://admin.shopify.com/store/${actions.platforms.shopify.storeId}/themes`, {
              active: true,
            }),
        },
        {
          label: 'Shopify All Collections',
          action: () =>
            GM_openInTab(`https://admin.shopify.com/store/${actions.platforms.shopify.storeId}/collections`, {
              active: true,
            }),
        },
        {
          // label: 'Copy Shopify preview link',
          hotkey: 'Backquote',
          action: () => {
            let url = window.location.href;
            const themeId = window.unsafeWindow?.Shopify?.theme?.id;

            if (window.unsafeWindow?.Shopify?.theme?.role === 'unpublished' && themeId) {
              url = `${url}${url.includes('?') ? '&' : '?'}preview_theme_id=${themeId}`;
            }

            GM_setClipboard(url);
          },
        },
      ],
      resources: [
        {
          test: () =>
            actions.platforms.shopify.page &&
            actions.platforms.shopify.page.resourceId &&
            actions.platforms.shopify.page.pageType === 'product',
          actions: [
            {
              label: 'Shopify Product',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `https://admin.shopify.com/store/${actions.platforms.shopify.storeId}/products/${actions.platforms.shopify.page.resourceId}`,
                  { active: true },
                ),
            },
          ],
        },
        {
          test: () =>
            actions.platforms.shopify.page &&
            actions.platforms.shopify.page.resourceId &&
            actions.platforms.shopify.page.pageType === 'collection',
          actions: [
            {
              label: 'Shopify Collection',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `https://admin.shopify.com/store/${actions.platforms.shopify.storeId}/collections/${actions.platforms.shopify.page.resourceId}`,
                  { active: true },
                ),
            },
          ],
        },
      ],
    },
    bigcommerce: {
      test: () => window.unsafeWindow?.BCData && actions.platforms.bigcommerce.storeHash,
      // When logged in to the store admin BC renders JS with admin bar init even if it's hidden,
      // we parse those init params to get channelId and categoryId
      _bcAdminBarParams: (() => {
        const paramsStr = document.documentElement.innerHTML.match(/window\.bcAdminBar\(([^)]+)\)/)?.[1];
        return paramsStr?.split(/',\s+'/);
      })(),
      get storeHash() {
        return document
          .querySelector("head link[href*='.bigcommerce.com/s-']")
          ?.href?.split('s-')[1]
          .split('/')[0];
      },
      get productId() {
        return document.querySelector('input[name=product_id]')?.value;
      },
      get channelId() {
        return this._bcAdminBarParams?.[1];
      },
      get categoryId() {
        return this._bcAdminBarParams?.[4];
      },
      get isBrandPage() {
        return !!window.document.querySelector(
          'body.page-type-brand, body.page-type_brand, body.type-brand, body.brand, .main.brand, main.pages-css-brand, body.page--brand, .page.brand, body.page_type__brand, [data-content-region="brand_below_header"]',
        );
      },
      get isWebPage() {
        return !!window.document.querySelector(
          'body.page-type-page, body.page-type_page, body.type-page, body.page_type__page',
        );
      },
      general: [
        {
          label: 'BigCommerce Admin',
          hotkey: '1',
          order: 1,
          action: () =>
            GM_openInTab(
              `https://store-${actions.platforms.bigcommerce.storeHash}.mybigcommerce.com/manage`,
              {
                active: true,
              },
            ),
        },
        {
          label: 'BigCommerce All Categories',
          action: () =>
            GM_openInTab(
              `https://store-${actions.platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/products/categories`,
              { active: true },
            ),
        },
      ],
      resources: [
        {
          test: () => actions.platforms.bigcommerce.storeHash && actions.platforms.bigcommerce.productId,
          actions: [
            {
              label: 'BigCommerce Product',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `https://store-${actions.platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/products/${actions.platforms.bigcommerce.productId}/edit`,
                  { active: true },
                ),
            },
          ],
        },
        {
          test: () =>
            actions.platforms.bigcommerce.storeHash &&
            actions.platforms.bigcommerce.channelId &&
            !actions.platforms.bigcommerce.isBrandPage &&
            !actions.platforms.bigcommerce.isWebPage &&
            actions.platforms.bigcommerce.categoryId,
          actions: [
            {
              label: 'BigCommerce Category',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `https://store-${actions.platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/products/categories/${actions.platforms.bigcommerce.channelId}/edit/${actions.platforms.bigcommerce.categoryId}`,
                  { active: true },
                ),
            },
          ],
        },
        {
          test: () =>
            actions.platforms.bigcommerce.storeHash &&
            actions.platforms.bigcommerce.categoryId &&
            actions.platforms.bigcommerce.isBrandPage,
          actions: [
            {
              label: 'BigCommerce Brand',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `https://store-${actions.platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/products/brands/${actions.platforms.bigcommerce.categoryId}/edit`,
                  { active: true },
                ),
            },
          ],
        },
        {
          test: () =>
            actions.platforms.bigcommerce.storeHash &&
            actions.platforms.bigcommerce.channelId &&
            actions.platforms.bigcommerce.categoryId &&
            actions.platforms.bigcommerce.isWebPage,
          actions: [
            {
              label: 'BigCommerce Page',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `https://store-${actions.platforms.bigcommerce.storeHash}.mybigcommerce.com/manage/channel/${actions.platforms.bigcommerce.channelId}/pages/${actions.platforms.bigcommerce.categoryId}/edit`,
                  { active: true },
                ),
            },
          ],
        },
      ],
    },
    woocommerce: {
      test: () => window.unsafeWindow?.woocommerce_params || window.unsafeWindow?.wc_order_attribution,
      get productId() {
        return (
          window.unsafeWindow?.cm_product?.[0] || document.querySelector('button[name="add-to-cart"]')?.value
        );
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
          label: 'WooCommerce Admin',
          hotkey: '1',
          order: 1,
          action: () =>
            GM_openInTab(`${window.location.origin}/wp-admin/admin.php?page=wc-admin`, { active: true }),
        },
        {
          label: 'WooCommerce All Categories',
          action: () =>
            GM_openInTab(
              `${window.location.origin}/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product`,
              { active: true },
            ),
        },
      ],
      resources: [
        {
          test: () => actions.platforms.woocommerce.productId,
          actions: [
            {
              label: 'WooCommerce Product',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `${window.location.origin}/wp-admin/post.php?post=${actions.platforms.woocommerce.productId}&action=edit`,
                  { active: true },
                ),
            },
          ],
        },
        {
          test: () => actions.platforms.woocommerce.categoryName,
          actions: [
            {
              label: 'WooCommerce Category',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `${
                    window.location.origin
                  }/wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product&s=${actions.platforms.woocommerce.categoryName.replace(
                    ' ',
                    '+',
                  )}`,
                  { active: true },
                ),
            },
          ],
        },
        {
          test: () => actions.platforms.woocommerce.categoryHandle,
          actions: [
            {
              label: 'WooCommerce Category Products',
              action: () =>
                GM_openInTab(
                  `${window.location.origin}/wp-admin/edit.php?product_cat=${actions.platforms.woocommerce.categoryHandle}&post_type=product`,
                  { active: true },
                ),
            },
          ],
        },
      ],
    },
    shift4shop: {
      test: () =>
        window.unsafeWindow?._3d_cart || window.unsafeWindow?._3dThemeType || window.unsafeWindow?._3d_item,
      get productId() {
        return window.unsafeWindow?._3d_item?.catalogid;
      },
      get catalogId() {
        // both products and categories have catalog ID
        return window.unsafeWindow?.catID;
      },
      // Shouldn't be called without explicit user intent
      get securityToken() {
        return new Promise((resolve, reject) => {
          const storeUrl = window.location.origin;
          const tokenKey = `shift4shop_security_token_${storeUrl}`;
          const timestampKey = `shift4shop_token_timestamp_${storeUrl}`;

          const cachedToken = GM_getValue(tokenKey);
          const tokenTimestamp = GM_getValue(timestampKey);
          const tokenExpiry = 24 * 60 * 60 * 1000;
          if (cachedToken && tokenTimestamp && Date.now() - tokenTimestamp < tokenExpiry) {
            return resolve(cachedToken);
          }

          GM_xmlhttpRequest({
            method: 'GET',
            url: `${storeUrl}/admin/category_view.asp`,
            onload(response) {
              const tokenMatch = response.responseText.match(/hdnSecurityToken=([^&]+)/);
              if (tokenMatch && tokenMatch[1]) {
                GM_setValue(tokenKey, tokenMatch[1]);
                GM_setValue(timestampKey, Date.now());
                resolve(tokenMatch[1]);
              } else {
                reject(new Error('Security token not found in the response.'));
              }
            },
            onerror(error) {
              reject(error);
            },
          });
        });
      },
      general: [
        {
          label: 'Shift4Shop Admin',
          hotkey: '1',
          order: 1,
          action: () =>
            GM_openInTab(`${window.location.origin}/admin/admin-home.asp`, {
              active: true,
            }),
        },
        {
          label: 'Shift4Shop All Categories',
          action: () =>
            GM_openInTab(`${window.location.origin}/admin/category_view.asp`, {
              active: true,
            }),
        },
      ],
      resources: [
        {
          test: () => actions.platforms.shift4shop.productId,
          actions: [
            {
              label: 'Shift4Shop Product',
              hotkey: '2',
              order: 2,
              action: () =>
                GM_openInTab(
                  `${window.location.origin}/admin/iteminfo.asp?catid=${actions.platforms.shift4shop.productId}&pannel=1`,
                  { active: true },
                ),
            },
          ],
        },
        {
          test: () =>
            !actions.platforms.shift4shop.productId && !isNaN(actions.platforms.shift4shop.catalogId),
          actions: [
            {
              label: 'Shift4Shop Category',
              hotkey: '2',
              order: 2,
              action: () => {
                actions.platforms.shift4shop.securityToken
                  .then((securityToken) => {
                    GM_openInTab(
                      `${window.location.origin}/admin/category_view.asp?action=options&hdnSecurityToken=${securityToken}&catid=${actions.platforms.shift4shop.catalogId}`,
                      { active: true },
                    );
                  })
                  .catch((error) => {
                    alert('Failed to get security token\nTry to log in to the store manager');
                    console.error('Failed to get security token:', error);
                  });
              },
            },
          ],
        },
      ],
    },
  },
  common: {
    test: () => actions.common.storeId,
    get storeId() {
      return window.unsafeWindow?.Convermax?.templates?.config?.requestConfig?.storeId;
    },
    get productId() {
      return window.unsafeWindow?.Convermax?.templates?.config?.productConfig?.localItemId;
    },
    get isFitmentSearch() {
      return !!window.unsafeWindow?.Convermax?.templates?.config?.fitmentSearchConfig?.fields?.length;
    },
    get vehicle() {
      return window.unsafeWindow?.Convermax?.getVehicle();
    },
    get serverUrl() {
      return window.unsafeWindow?.Convermax.useDevServer
        ? `https://localhost.convermax.dev/${this.storeId}`
        : `https://${this.storeId}.myconvermax.com`;
    },
    general: [
      {
        label: 'Convermax Admin',
        hotkey: '3',
        order: 3,
        action: () =>
          GM_openInTab(`https://myconvermax.com/${actions.common.storeId}/status`, { active: true }),
      },
      {
        // label: 'Copy Convermax StoreID',
        hotkey: 'Backquote',
        ctrlKey: true,
        action: () => GM_setClipboard(actions.common.storeId),
      },
    ],
    resources: [
      {
        test: () => actions.common.storeId && actions.common.isFitmentSearch && actions.common.productId,
        actions: [
          {
            label: 'Fitment Chart',
            hotkey: '4',
            order: 4,
            action: () =>
              GM_openInTab(
                `${actions.common.serverUrl}/ymm/fitments.html?productId=${actions.common.productId}&includeSource=true`,
                { active: true },
              ),
          },
        ],
      },
      {
        test: () => actions.common.storeId && actions.common.isFitmentSearch,
        actions: [
          {
            label: 'Vehicle Info',
            hotkey: '5',
            order: 5,
            action: () => {
              if (actions.common.vehicle) {
                const url = new URL(`${actions.common.serverUrl}/ymm/vehicleinfo.html`);
                for (const [key, value] of Object.entries(actions.common.vehicle)) {
                  url.searchParams.set(key, value);
                }
                GM_openInTab(url.href, { active: true });
              } else {
                alert('Convermax Tools: No vehicle selected!');
              }
            },
          },
        ],
      },
    ],
  },
};

function registerActions(commands) {
  commands
    .filter(({ label }) => label)
    .sort((a, b) => (a.order || 9) - (b.order || 9))
    .forEach(({ hotkey, ctrlKey, label, action }) => {
      const hotkeyStr = ` [${ctrlKey ? 'Ctrl' : 'Alt'} + ${hotkey === 'Backquote' ? '`' : hotkey}]`;
      return GM_registerMenuCommand(`${label}${hotkey ? hotkeyStr : ''}`, action);
    });
  commands
    .filter(({ hotkey }) => hotkey)
    .forEach(({ hotkey, ctrlKey, action }) => {
      document.addEventListener('keydown', (e) => {
        if (
          !e.shiftKey &&
          (e.key === hotkey || e.code === hotkey) &&
          ((ctrlKey && e.ctrlKey && !e.altKey) || (!ctrlKey && !e.ctrlKey && e.altKey))
        ) {
          e.preventDefault();
          action();
        }
      });
    });
}

async function registerPlatformActions() {
  const platform = Object.values(actions.platforms).find((p) => p.test());

  if (platform) {
    const commands = [
      ...platform.general,
      ...platform.resources.filter((r) => r.test()).flatMap((r) => r.actions),
    ];
    registerActions(commands);
  }
}

function registerCommonActions() {
  if (actions.common.test()) {
    const commands = [
      ...actions.common.general,
      ...actions.common.resources.filter((r) => r.test()).flatMap((r) => r.actions),
    ];
    registerActions(commands);
  }
}

function isActionExpired(action, secondsTTL = 30) {
  return Date.now() - GM_getValue(`${action}StartedAt`, 0) > secondsTTL * 1000;
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
  } else if (isAdminLogin && !isActionExpired('fixShopifyAdmin') && redirectPath) {
    GM_setValue('fixShopifyAdminLocation', '');
    window.location.replace(`https://admin.shopify.com/store/${storeId}${redirectPath}`);
    return true;
  }
  return false;
}

function fixNoStoreAtShopifyPartners() {
  if (isActionExpired('fixShopifyAdmin')) {
    return true;
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
  } else if (isPartnersSearch && !isTabSelected && [...Results].length) {
    const form = Results[0].querySelector('form[action^="/201897/stores/"][action$="/login_managed"]');
    form.removeAttribute('target');
    form.querySelector('button[type="submit"]').click();
    return true;
  }
  return false;
}

function bypassShopifyStub() {
  if (window.location.pathname.match(/(\/\w{2})?\/password/) && actions.platforms.shopify.test()) {
    window.location.assign(`${window.location.origin}/admin/themes`);
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

function bypassBigCommerceStubInit() {
  const isPreLaunch =
    !!document.querySelector("head link[href*='bigcommerce.com/'][href*='prelaunch']") &&
    !!document.querySelector('input#guestTkn');
  const isMaintenance = !!document.querySelector("head link[data-stencil-stylesheet][href*='maintenance']");
  const redirectPath = GM_getValue('bypassBigCommerceStubLocation', '');
  const blackList = GM_getValue('bypassBigCommerceStubBlackList', []);

  if (isPreLaunch && window.location.href.includes('guestTkn=')) {
    return;
  }

  if ((isPreLaunch || isMaintenance) && !blackList.includes(window.location.hostname)) {
    if (redirectPath && !isActionExpired('bypassBigCommerceStub')) {
      GM_setValue('bypassBigCommerceStubBlackList', [...blackList, window.location.hostname]);
    } else {
      GM_setValue('bypassBigCommerceStubStartedAt', Date.now());
      GM_setValue('bypassBigCommerceStubLocation', window.location.href);
      window.location.replace(`${window.location.origin}/admin`);
    }
  }
}

function bypassBigCommerceStub() {
  if (isActionExpired('bypassBigCommerceStub')) {
    return true;
  }

  const redirectPath = GM_getValue('bypassBigCommerceStubLocation', '');
  const redirectURL = redirectPath ? new URL(redirectPath) : null;
  const multiStorefrontButton = window.document.querySelector(
    'nav button:has(span[title="View storefronts"]):not(:disabled)',
  );
  const singleStorefrontButton = window.document.querySelector(
    'nav button:has(span[title="View storefront"]):not(:disabled)',
  );

  if (
    window.location.href === 'https://login.bigcommerce.com/login' &&
    !window.document.querySelector('.login-form .alert-box:not(:empty)') && // Failed login msg
    window.document.querySelector('input#user_email')?.value &&
    window.document.querySelector('input#user_password')?.value
  ) {
    window.document.querySelector('input#login_submit_button')?.click();
    return true;
  } else if (
    window.location.href.endsWith('mybigcommerce.com/manage/dashboard') &&
    (multiStorefrontButton || singleStorefrontButton) &&
    redirectURL
  ) {
    if (multiStorefrontButton) {
      multiStorefrontButton.click();
      const host = redirectURL.hostname.replace('www.', '');
      const getRedirectButton = () =>
        window.document.querySelector(`form[action*="${host}"] button[type="submit"]:not(:disabled)`);
      ensureContextIsSet(getRedirectButton, 10000).then(() => {
        const button = getRedirectButton();
        button?.closest('form')?.removeAttribute('target');
        button?.click();
      });
    } else if (singleStorefrontButton) {
      singleStorefrontButton.closest('form')?.removeAttribute('target');
      singleStorefrontButton.click();
    }
    return true;
  } else if (window.location.origin === redirectURL?.origin && window.location.href.includes('?ctk=')) {
    GM_setValue('bypassBigCommerceStubLocation', '');
    window.location.replace(redirectURL.href);
    return true;
  }
  return false;
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
    'applications',
    'themes',
    'edit_theme_code',
    'pages',
    'links',
  ];

  const targetButton = document.querySelector('#create-new-store-button');

  const button = document.createElement('button');
  button.textContent = 'Select permissions';
  button.className = 'Polaris-Button Polaris-Button--primary';
  button.style.marginLeft = '10px';
  button.setAttribute('type', 'button');

  button.addEventListener('click', () => {
    requiredPermissions.forEach((permission) => {
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

  bypassShopifyStub();
  bypassBigCommerceStubInit();

  ensureContextIsSet(() => actions.platforms.some((p) => p.test()), 10000).then(() => {
    registerPlatformActions();
  });

  ensureContextIsSet(() => window.unsafeWindow?.Convermax?.initialized, 10000).then(() => {
    registerCommonActions();
  });

  const url = window.location.href;
  if (url.startsWith('https://admin.shopify.com/store/')) {
    ensureContextIsSet(() => fixNoAccessToShopifyAdmin(), 10000);
  }
  if (url.startsWith('https://partners.shopify.com/201897/stores?search_value=')) {
    ensureContextIsSet(() => fixNoStoreAtShopifyPartners(), 10000);
  }
  if (url.startsWith('https://partners.shopify.com/')) {
    ensureContextIsSet(() => document.querySelector('#create-new-store-button'), 10000).then(() =>
      setupPermissionsButton(),
    );
  }

  const redirectPath = GM_getValue('bypassBigCommerceStubLocation', '');
  const redirectURL = redirectPath ? new URL(redirectPath) : null;
  if (
    !isActionExpired('bypassBigCommerceStub') &&
    (url === 'https://login.bigcommerce.com/login' ||
      url.includes('mybigcommerce.com/manage') ||
      (window.location.origin === redirectURL?.origin && window.location.href.includes('?ctk=')))
  ) {
    ensureContextIsSet(() => bypassBigCommerceStub(), 10000);
  }
})();
