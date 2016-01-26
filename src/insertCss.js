/**
 * Isomorphic CSS style loader for Webpack
 *
 * Copyright © 2015 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const prefix = 's';
const inserted = {};
const canUseURL = typeof URL === 'function' &&
  typeof URL.createObjectURL === 'function' &&
  typeof URL.revokeObjectURL === 'function' &&
  typeof Blob === 'function' &&
  typeof btoa === 'function';

// Base64 encoding and decoding - The "Unicode Problem"
// https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
    String.fromCharCode(`0x${p1}`)
  ));
}

/**
 * Remove style/link elements for specified Module IDs
 * if they are no longer referenced by UI components.
 */
function removeCss(ids) {
  for (const id of ids) {
    if (--inserted[id] <= 0) {
      const elem = document.getElementById(prefix + id);
      if (elem) {
        elem.parentNode.removeChild(elem);
        if (canUseURL && elem.tagName === 'LINK' && elem.href) {
          URL.revokeObjectURL(elem.href);
        }
      }
    }
  }
}

/**
 * Example:
 *   // Insert CSS styles object generated by `css-loader` into DOM
 *   var removeCss = insertCss([[1, 'body { color: red; }']]);
 *
 *   // Remove it from the DOM
 *   removeCss();
 */
function insertCss(styles, options) {
  const { replace, prepend } = Object.assign({
    replace: false,
    prepend: false,
  }, options);

  for (const [id, css, media, sourceMap] of styles) {
    if (inserted[id]) {
      if (!replace) {
        inserted[id]++;
        continue;
      }
    }

    inserted[id] = 1;

    let elem = document.getElementById(prefix + id);
    let create = false;

    if (!elem) {
      create = true;

      if (sourceMap && canUseURL) {
        elem = document.createElement('link');
        elem.setAttribute('rel', 'stylesheet');
      } else {
        elem = document.createElement('style');
        elem.setAttribute('type', 'text/css');
      }

      elem.id = prefix + id;

      if (media) {
        elem.setAttribute('media', media);
      }
    }

    if (elem.tagName === 'STYLE') {
      if ('textContent' in elem) {
        elem.textContent = css;
      } else {
        elem.styleSheet.cssText = css;
      }
    } else {
      const blob = new Blob([
        `${css}\n/*# sourceMappingURL=data:application/json;base64,` +
        `${b64EncodeUnicode(JSON.stringify(sourceMap))} */`,
      ], { type: 'text/css' });

      const href = elem.href;
      elem.href = URL.createObjectURL(blob);

      if (href) {
        URL.revokeObjectURL(href);
      }
    }

    if (create) {
      if (prepend) {
        document.head.insertBefore(elem, document.head.childNodes[0]);
      } else {
        document.head.appendChild(elem);
      }
    }
  }

  return removeCss.bind(null, styles.map(x => x[0]));
}

module.exports = insertCss;
