import { CONFIG } from "./config.js";
import { getTrackingParams, toMetadataConfig } from "./tracking.js";
import { initLiffAndGetProfile } from "./liff-profile.js";
import { renderCalcomInline } from "./calcom-embed.js";
import {
  setupPageText,
  setStatus,
  setFallbackLink,
  hidePrivacyNoticeIfNeeded,
  renderDebugPanel,
  showFatalError
} from "./ui.js";

async function main() {
  setupPageText();
  hidePrivacyNoticeIfNeeded();

  const tracking = getTrackingParams(CONFIG.DEFAULT_TRACKING);

  try {
    setStatus("info", "正在初始化 LINE 身份", "請稍候，系統正在取得 LINE 預約身份。");

    const lineProfile = await initLiffAndGetProfile();

    // liff.login() 已觸發，等待登入後回跳。
    if (lineProfile === null) {
      setStatus("info", "正在前往 LINE 登入", "登入完成後會自動回到預約頁。");
      return;
    }

    const metadataConfig = toMetadataConfig(tracking, lineProfile, { isLiff: true });

    const displayName = lineProfile.lineDisplayName || "";
    const prefill = displayName ? { name: displayName } : {};

    renderDebugPanel(tracking.debug, {
      mode: "liff",
      tracking,
      lineProfile,
      metadataConfig
    });

    setStatus(
      "success",
      displayName ? `您好，${displayName}` : "LINE 預約頁已就緒",
      "請在下方選擇服務時段。可預約時間由 Cal.com 依營業時間、Google Calendar 與 Buffer Time 自動判斷。"
    );

    const result = await renderCalcomInline({
      elementSelector: "#cal-container",
      metadataConfig,
      prefill
    });

    setFallbackLink(result.directUrl);

    window.setTimeout(() => {
      setFallbackLink(result.directUrl);
    }, CONFIG.FALLBACK_TIMEOUT_MS);
  } catch (error) {
    showFatalError(error);
    setFallbackLink(CONFIG.CALCOM_EVENT_URL);
  }
}

main();
