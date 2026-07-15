import { CONFIG } from "./config.js";

/**
 * 安全解碼字串。避免 malformed URI 讓整頁中斷。
 */
function safeDecode(value) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * LIFF 透過 https://liff.line.me/{LIFF_ID}?src=... 進入時，
 * 自訂參數可能會被 LINE 放在 liff.state。
 *
 * 可能型態：
 * - ?src=line_oa&medium=richmenu
 * - /liff-booking.html?src=line_oa&medium=richmenu
 * - %3Fsrc%3Dline_oa%26medium%3Drichmenu
 */
function parseLiffStateParams(currentParams) {
  const rawState = currentParams.get("liff.state");
  if (!rawState) return new URLSearchParams();

  const decoded = safeDecode(rawState);
  let query = "";

  if (decoded.startsWith("?")) {
    query = decoded.slice(1);
  } else if (decoded.includes("?")) {
    query = decoded.split("?").slice(1).join("?");
  } else {
    query = decoded;
  }

  return new URLSearchParams(query);
}

/**
 * 合併一般 query params 與 liff.state params。
 * 一般 query 優先，其次 liff.state。
 */
export function getMergedParams() {
  const currentParams = new URLSearchParams(window.location.search);
  const stateParams = parseLiffStateParams(currentParams);
  const merged = new URLSearchParams();

  for (const [key, value] of stateParams.entries()) {
    merged.set(key, value);
  }

  for (const [key, value] of currentParams.entries()) {
    if (!key.startsWith("liff.")) {
      merged.set(key, value);
    }
  }

  return merged;
}

function getParam(params, keys, fallback) {
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null && value !== "") return value;
  }
  return fallback;
}

/**
 * 取得來源追蹤資料。
 *
 * 建議命名：
 * - source: line_oa / instagram / official_site / qr_code / unknown
 * - medium: richmenu / bio_link / homepage_cta / service_page_cta / offline_qr
 * - campaign: booking_main / trial_offer
 * - placement: richmenu_booking / ig_profile / home_hero
 */
export function getTrackingParams(defaults = CONFIG.DEFAULT_TRACKING) {
  const params = getMergedParams();

  return {
    source: getParam(params, ["src", "source", "utm_source"], defaults.source),
    medium: getParam(params, ["medium", "utm_medium"], defaults.medium),
    campaign: getParam(params, ["campaign", "utm_campaign"], defaults.campaign),
    placement: getParam(params, ["placement", "utm_content"], defaults.placement),
    sourceUrl: window.location.href,
    referrer: document.referrer || "",
    isTest: params.get("test") === "true" ? "true" : "false",
    debug: params.get("debug") === "true" || CONFIG.DEBUG_BY_DEFAULT
  };
}

export function toMetadataConfig(tracking, lineProfile = null, options = {}) {
  const isLiff = options.isLiff ? "true" : "false";

  return {
    "metadata[lineUserId]": lineProfile?.lineUserId || "",
    "metadata[lineDisplayName]": lineProfile?.lineDisplayName || "",
    "metadata[linePictureUrl]": lineProfile?.pictureUrl || "",

    "metadata[source]": tracking.source,
    "metadata[medium]": tracking.medium,
    "metadata[campaign]": tracking.campaign,
    "metadata[placement]": tracking.placement,
    "metadata[sourceUrl]": tracking.sourceUrl,
    "metadata[referrer]": tracking.referrer,
    "metadata[isLiff]": isLiff,
    "metadata[isTest]": tracking.isTest
  };
}
