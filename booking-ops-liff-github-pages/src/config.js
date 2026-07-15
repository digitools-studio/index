/**
 * GitHub Pages 靜態部署設定
 *
 * 只放公開資訊，請勿放：
 * - LINE Channel Access Token
 * - Cal.com API Key
 * - Google API Secret
 * - Make.com 管理金鑰
 */

export const CONFIG = {
  BRAND_NAME: "Digital Studio",
  PAGE_TITLE: "線上預約",
  PAGE_SUBTITLE: "請選擇您方便的服務時段，系統會自動建立預約並發送確認通知。",

  /**
   * 必改：LINE Developers Console → LIFF → LIFF ID
   * 範例：2001234567-AbCdEfGh
   */
  LIFF_ID: "REPLACE_WITH_LIFF_ID",

  /**
   * 必改：Cal.com 公開預約連結
   * 範例：https://cal.com/your-brand/consultation
   */
  CALCOM_EVENT_URL: "https://cal.com/digital-studio-gtrwkk/30min",

  /**
   * Cal.com Embed 設定
   */
  CALCOM_NAMESPACE: "30min",
  CALCOM_LAYOUT: "month_view",
  CALCOM_ORIGIN: "https://app.cal.com",
  CALCOM_EMBED_SCRIPT_URL: "https://app.cal.com/embed/embed.js",
  CALCOM_USE_SLOTS_VIEW_ON_SMALL_SCREEN: "true",
  CALCOM_FORWARD_QUERY_PARAMS: true,

  /**
   * URL 未帶參數時的預設值
   */
  DEFAULT_TRACKING: {
    source: "unknown",
    medium: "unknown",
    campaign: "booking_main",
    placement: "unknown"
  },

  /**
   * 官網直接預約頁的預設來源
   */
  WEBSITE_DEFAULT_TRACKING: {
    source: "official_site",
    medium: "booking_page",
    campaign: "booking_main",
    placement: "website_booking_page"
  },

  /**
   * 顯示資料使用說明
   */
  SHOW_PRIVACY_NOTICE: true,

  /**
   * 除非 URL 帶 debug=true，否則不顯示 debug panel
   */
  DEBUG_BY_DEFAULT: false,

  /**
   * Cal.com Embed 載入超過此秒數會顯示 fallback link
   */
  FALLBACK_TIMEOUT_MS: 6500
};
