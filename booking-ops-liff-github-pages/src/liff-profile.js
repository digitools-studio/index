import { CONFIG } from "./config.js";

/**
 * 初始化 LIFF 並取得 LINE 使用者資料。
 *
 * 注意：
 * - LIFF app 必須在 LINE Developers Console 選擇 profile scope。
 * - 在外部瀏覽器開啟時，withLoginOnExternalBrowser=true 會協助登入流程。
 * - 若使用者取消授權，仍應允許預約，只是 lineUserId 會為空。
 */
export async function initLiffAndGetProfile() {
  if (!window.liff) {
    throw new Error("LINE LIFF SDK 尚未載入。請確認 liff-booking.html 已引入 LIFF SDK。");
  }

  if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID === "REPLACE_WITH_LIFF_ID") {
    throw new Error("請先在 src/config.js 設定 LIFF_ID。");
  }

  await window.liff.init({
    liffId: CONFIG.LIFF_ID,
    withLoginOnExternalBrowser: true
  });

  if (!window.liff.isLoggedIn()) {
    window.liff.login({
      redirectUri: window.location.href
    });
    return null;
  }

  try {
    const profile = await window.liff.getProfile();

    return {
      lineUserId: profile.userId || "",
      lineDisplayName: profile.displayName || "",
      pictureUrl: profile.pictureUrl || "",
      statusMessage: profile.statusMessage || "",
      isInClient: window.liff.isInClient(),
      os: window.liff.getOS(),
      liffVersion: window.liff.getVersion(),
      lineVersion: window.liff.getLineVersion ? window.liff.getLineVersion() : null
    };
  } catch (error) {
    console.warn("取得 LINE profile 失敗，將以匿名狀態繼續預約。", error);

    return {
      lineUserId: "",
      lineDisplayName: "",
      pictureUrl: "",
      statusMessage: "",
      isInClient: window.liff.isInClient(),
      os: window.liff.getOS(),
      liffVersion: window.liff.getVersion(),
      lineVersion: window.liff.getLineVersion ? window.liff.getLineVersion() : null,
      profileError: {
        code: error?.code || "",
        message: error?.message || String(error)
      }
    };
  }
}
