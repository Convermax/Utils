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
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  let convermaxItems = [];
  let lastResponse = null;

  init();

  function init() {
    addStyles();
    setupExplainModal();
    patchFetchForExplainScores();
    observeItemsContainer();
  }

  function observeItemsContainer() {
    const container = document.querySelector('.cm_SearchResult');
    const response = window.Convermax?.getSearchResponse;

    if (!container || !response) {
      setTimeout(observeItemsContainer, 300);
      return;
    }

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          checkForLatestUpdates();
        }
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    checkForLatestUpdates();
  }

  function checkForLatestUpdates() {
    const response = window.Convermax.getSearchResponse();
    if (response && response !== lastResponse && response?.items?._items?.length) {
      lastResponse = response;

      convermaxItems = response?.items?._items.map((i) => i?._item).filter(Boolean) || [];

      insertOrUpdateScoreOverlays();
    }
  }

  function insertOrUpdateScoreOverlays() {
    const containers = document.querySelectorAll('.cm_SearchResult .cmRepeater_items');
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

    cards.forEach((card, index) => {
      const img = card.querySelector('img');
      if (!img) {
        return;
      }

      let overlay = card.querySelector('.cm_explainScores');

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'cm_explainScores';

        const style = window.getComputedStyle(card);
        if (style.position === 'static') {
          card.style.position = 'relative';
        }

        img.insertAdjacentElement('afterend', overlay);
      }

      overlay.innerHTML = '';

      const item = convermaxItems[index];

      if (item) {
        const fields = [
          item._rank ? `Rank: ${item._rank}` : null,
          item._score ? `Score: ${item._score.toFixed(3)}` : null,
          item.convermax_boost ? `Boost: ${item.convermax_boost.toFixed(3)}` : null,
          item._popularity ? `Popularity: ${item._popularity}` : null,
        ].filter(Boolean);

        fields.forEach((text) => {
          const line = document.createElement('div');
          line.innerHTML = text;
          overlay.appendChild(line);
        });

        if (item._explanation) {
          const btn = document.createElement('button');
          btn.textContent = 'Explain';
          btn.className = 'cm_explainBtn';

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

  function patchFetchForExplainScores() {
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
      let url;

      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof Request) {
        ({ url } = input);
      } else {
        return originalFetch(input, init);
      }

      if (/convermax\.(com|dev).*search\.json/.test(url) && !url.includes('explainscores=true')) {
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

  function setupExplainModal() {
    function create() {
      if (document.getElementById('cm_explainModal')) {
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'cm_explainModal';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div id="cm_explainModalContent">
          <span id="cm_explainModalClose">&times;</span>
          <div id="cm_explainModalBody"></div>
        </div>`;

      document.body.appendChild(modal);

      document.getElementById('cm_explainModalClose').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }

    if (document.body) {
      create();
    } else {
      document.addEventListener('DOMContentLoaded', create, { once: true });
    }
  }

  function showModal(content) {
    const body = document.getElementById('cm_explainModalBody');
    if (!body) {
      return;
    }
    const escaped = escapeHTML(content);

    body.innerHTML = `<div class="cm_modalText">${escaped}</div>`;

    document.getElementById('cm_explainModal').style.display = 'flex';
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function addStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
            .cm_explainScores {
                position: absolute;
                top: 5px;
                left: 5px;
                background-color: rgba(255,255,255,0.9);
                padding: 4px 6px;
                font-size: 12px;
                font-weight: bold;
                border-radius: 3px;
                z-index: 90;
            }

            #cm_explainModal {
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

            #cm_explainModalContent {
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                position: relative;
            }

            #cm_explainModalClose {
                position: absolute;
                top: -1px;
                right: 8px;
                font-size: 20px;
                cursor: pointer;
            }

            .cm_explainScores .cm_explainBtn {
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

           .cm_explainScores .cm_explainBtn:hover {
                background-color: #e0e0e0;
           }

           .cm_modalText {
               white-space: pre-wrap;
               font-size: 12px;
               line-height: 1.4;
               color: rgb(0, 0, 0);
           }`;

    document.head.appendChild(styleEl);
  }
})();
