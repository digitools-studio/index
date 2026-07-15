import { CONFIG } from "./config.js";
import { getTrackingParams, toMetadataConfig } from "./tracking.js";
import { renderCalcomInline } from "./calcom-embed.js";
import {
  setupPageText,
  setStatus,
  setFallbackLink,
  renderDebugPanel,
  showFatalError
} from "./ui.js";

async function main() {
  setupPageText({
    title: "官網線上預約",
    subtitle: "請選擇可預約時段，完成後系統會自動建立紀錄。"
  });

  const tracking = getTrackingParams(CONFIG.WEBSITE_DEFAULT_TRACKING);

  try {
    const metadataConfig = toMetadataConfig(tracking, null, { isLiff: false });

    renderDebugPanel(tracking.debug, {
      mode: "website",
      tracking,
      metadataConfig
    });

    setStatus(
      "success",
      "官網預約頁已就緒",
      "請在下方選擇服務時段。官網預約不一定會有 LINE User ID，但來源追蹤仍會寫入 Cal.com metadata。"
    );

    const result = await renderCalcomInline({
      elementSelector: "#cal-container",
      metadataConfig,
      prefill: {}
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
