import { CONFIG } from "./config.js";

/**
 * 將 https://cal.com/user/event 轉成 Cal.com Embed 所需的 user/event。
 */
export function getCalLink(calcomEventUrl = CONFIG.CALCOM_EVENT_URL) {
  if (!calcomEventUrl || calcomEventUrl === "https://cal.com/your-brand/consultation") {
    throw new Error("請先在 src/config.js 設定 CALCOM_EVENT_URL。");
  }

  try {
    const url = new URL(calcomEventUrl);
    return url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  } catch {
    return calcomEventUrl.replace(/^https?:\/\/cal\.com\//, "").replace(/\/+$/, "");
  }
}

/**
 * 載入 Cal.com Embed SDK。
 */
export function loadCalEmbedSdk() {
  return new Promise((resolve, reject) => {
    if (window.Cal && window.Cal.loaded) {
      resolve(window.Cal);
      return;
    }

    (function (C, A, L) {
      const p = function (a, ar) {
        a.q.push(ar);
      };

      const d = C.document;

      C.Cal = C.Cal || function () {
        const cal = C.Cal;
        const ar = arguments;

        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          const script = d.createElement("script");
          script.src = A;
          script.async = true;
          script.onload = () => resolve(C.Cal);
          script.onerror = () => reject(new Error("Cal.com Embed SDK 載入失敗。"));
          d.head.appendChild(script);
          cal.loaded = true;
        }

        if (ar[0] === L) {
          const api = function () {
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = api;
            p(api, ar);
          } else {
            p(cal, ar);
          }
          return;
        }

        p(cal, ar);
      };
    })(window, "https://cal.com/embed.js", "init");

    // 觸發 script 注入
    window.Cal("init", CONFIG.CALCOM_NAMESPACE, {
      origin: "https://cal.com"
    });

    // 防止 onload 因快取或執行順序沒觸發。
    setTimeout(() => {
      if (window.Cal) resolve(window.Cal);
    }, 1200);
  });
}

/**
 * 內嵌 Cal.com booking page。
 */
export async function renderCalcomInline({ elementSelector, metadataConfig, prefill = {} }) {
  await loadCalEmbedSdk();

  const namespace = CONFIG.CALCOM_NAMESPACE;
  const calLink = getCalLink();

  window.Cal("init", namespace, {
    origin: "https://cal.com"
  });

  window.Cal.ns[namespace]("inline", {
    elementOrSelector: elementSelector,
    calLink,
    config: {
      layout: CONFIG.CALCOM_LAYOUT,
      ...prefill,
      ...metadataConfig
    }
  });

  window.Cal.ns[namespace]("ui", {
    hideEventTypeDetails: false,
    layout: CONFIG.CALCOM_LAYOUT
  });

  return {
    namespace,
    calLink,
    directUrl: CONFIG.CALCOM_EVENT_URL
  };
}
