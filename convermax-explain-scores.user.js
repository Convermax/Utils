// ==UserScript==
// @name         Convermax Explain Scores
// @namespace    convermax-dev
// @version      2026-02-06
// @description  Convermax Explain Scores
// @downloadURL  https://github.com/Convermax/Utils/raw/icon-vehicle-dynamics/expain-scores-tampermonkey/convermax-explain-scores.user.js
// @updateURL    https://github.com/Convermax/Utils/raw/icon-vehicle-dynamics/expain-scores-tampermonkey/convermax-explain-scores.user.js
// @author       johders
// @match        https://*/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=convermax.com
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const includeExplanation = true;
  let convermaxItems = [];
  let scheduled = false;

  let lastResponse = null;

  addStyles();
  setupModal();
  waitForStore();

  if (includeExplanation) {
    appendExplainScores();
  }

  function waitForStore() {
    if (!window.Convermax?.getSearchResponse) {
      requestAnimationFrame(waitForStore);
      return;
    }

    setupResponseObserver();
  }

  function setupResponseObserver() {
    function checkForUpdates() {
      const response = window.Convermax.getSearchResponse();
      if (response && response !== lastResponse) {
        lastResponse = response;

        const items = response?.items?._items || [];
        convermaxItems = items.map((i) => i?._item).filter(Boolean);

        if (convermaxItems.length && !scheduled) {
          scheduled = true;
          requestAnimationFrame(() => {
            insertOrUpdate();
            scheduled = false;
          });
        }
      }

      requestAnimationFrame(checkForUpdates);
    }

    requestAnimationFrame(checkForUpdates);
  }

  function insertOrUpdate() {
    const containers = document.querySelectorAll('.cmRepeater_items');
    if (!containers.length) {
      return;
    }

    containers.forEach(addExplainScoresToCards);
  }

  function addExplainScoresToCards(container) {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    const cards = Array.from(container.children);
    cards.forEach((card) => {
      const img = card.querySelector('img');
      if (!img) {
        return;
      }

      let overlay = card.querySelector('.explainScores');

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'explainScores';

        const style = window.getComputedStyle(card);
        if (style.position === 'static') {
          card.style.position = 'relative';
        }

        img.insertAdjacentElement('afterend', overlay);
      }

      const item = findItemForCard(card);

      overlay.innerHTML = '';

      if (item) {
        const fields = [
          item._rank != null ? `Rank: ${item._rank}` : null,
          item._score != null ? `Score: ${item._score.toFixed(3)}` : null,
          item.convermax_boost != null ? `Boost: ${item.convermax_boost.toFixed(3)}` : null,
          item._popularity != null ? `Popularity: ${item._popularity}` : null,
        ].filter(Boolean);

        fields.forEach((text) => {
          const line = document.createElement('div');
          line.innerHTML = text;
          overlay.appendChild(line);
        });

        if (item._explanation) {
          const btn = document.createElement('button');
          btn.textContent = 'Explain';
          btn.className = 'explainBtn';

          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            showModal(item._explanation);
          });

          overlay.appendChild(btn);
        }
      } else {
        overlay.textContent = 'Could not load scores';
      }
    });
  }

  function findItemForCard(card) {
    if (!convermaxItems.length) {
      return null;
    }

    const matchFinders = [tryFindById, tryFindByUrl];

    for (const matchFinder of matchFinders) {
      const match = matchFinder(card);
      if (match) {
        return match;
      }
    }

    return null;
  }

  function tryFindById(card) {
    const dataIdNode =
      card.querySelector('[data-entity-id]') ||
      card.querySelector('[data-productid]') ||
      card.querySelector('[id]');

    if (!dataIdNode) {
      return null;
    }

    const dataId =
      dataIdNode.getAttribute('data-entity-id') ||
      dataIdNode.getAttribute('data-productid') ||
      dataIdNode.getAttribute('id');

    if (!dataId) {
      return null;
    }

    return convermaxItems.find((i) => i.id === dataId) || null;
  }

  function tryFindByUrl(card) {
    const productUrl = card.querySelector('a')?.href;

    if (!productUrl) {
      return null;
    }

    return (
      convermaxItems.find((i) => productUrl.includes(i.url)) ||
      convermaxItems.find((i) => productUrl.includes(i.custom_url)) ||
      null
    );
  }

  function appendExplainScores() {
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
      let url;

      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof Request) {
        url = input.url;
      } else {
        return originalFetch(input, init);
      }

      if (url.includes('myconvermax.com/search.json') && !url.includes('explainscores=true')) {
        const newUrl = `${url}&explainscores=true`;

        if (input instanceof Request) {
          const newRequest = new Request(newUrl, input);
          return originalFetch(newRequest, init);
        }

        return originalFetch(newUrl, init);
      }

      return originalFetch(input, init);
    };
  }

  function setupModal() {
    if (!document.body) {
      requestAnimationFrame(setupModal);
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'explainModal';
    modal.style.display = 'none';

    modal.innerHTML = `
        <div id="explainModalContent">
            <span id="explainModalClose">&times;</span>
            <div id="explainModalBody"></div>
        </div>`;

    document.body.appendChild(modal);

    document.getElementById('explainModalClose').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    return modal;
  }

  function showModal(content) {
    const body = document.getElementById('explainModalBody');
    if (!body) {
      return;
    }
    const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    body.innerHTML = `<div class="modalText">${escaped}</div>`;

    document.getElementById('explainModal').style.display = 'flex';
  }

  function addStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
            .explainScores {
                position: absolute;
                top: 5px;
                left: 5px;
                background-color: rgba(255,255,255,0.9);
                padding: 4px 6px;
                font-size: 12px;
                font-weight: bold;
                border-radius: 3px;
                z-index: 1000;
            }

            #explainModal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }

            #explainModalContent {
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                position: relative;
            }

            #explainModalClose {
                position: absolute;
                top: -1px;
                right: 8px;
                font-size: 20px;
                cursor: pointer;
            }

            .explainScores .explainBtn {
                font-size: 12px;
                font-weight: normal;
                padding: 2px 6px;
                margin-top: 4px;
                cursor: pointer;
                border: 1px solid #888;
                border-radius: 3px;
                background-color: #f5f5f5;
                color: rgb(0, 0, 0);
           }

           .explainScores .explainBtn:hover {
                background-color: #e0e0e0;
           }

           .modalText {
               white-space: pre-wrap;
               font-size: 12px;
               line-height: 1.4;
               color: rgb(0, 0, 0);
           }`;

    document.head.appendChild(styleEl);
  }
})();
