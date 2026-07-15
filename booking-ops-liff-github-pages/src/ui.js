import { CONFIG } from "./config.js";

export function setupPageText({ title = CONFIG.PAGE_TITLE, subtitle = CONFIG.PAGE_SUBTITLE } = {}) {
  const titleEl = document.querySelector("#page-title");
  const subtitleEl = document.querySelector("#page-subtitle");

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
}

export function setStatus(type, title, message) {
  const card = document.querySelector("#status-card");
  const titleEl = document.querySelector("#status-title");
  const messageEl = document.querySelector("#status-message");

  if (!card) return;

  card.classList.remove("success", "error");
  if (type) card.classList.add(type);

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
}

export function setFallbackLink(url) {
  const fallbackCard = document.querySelector("#fallback-card");
  const fallbackLink = document.querySelector("#fallback-link");

  if (fallbackCard) fallbackCard.classList.remove("hidden");
  if (fallbackLink) fallbackLink.href = url;
}

export function hidePrivacyNoticeIfNeeded() {
  const privacyCard = document.querySelector("#privacy-card");
  if (!privacyCard) return;

  if (!CONFIG.SHOW_PRIVACY_NOTICE) {
    privacyCard.classList.add("hidden");
  }
}

export function renderDebugPanel(enabled, data) {
  const panel = document.querySelector("#debug-panel");
  const output = document.querySelector("#debug-output");

  if (!panel || !output) return;

  if (!enabled) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  output.textContent = JSON.stringify(data, null, 2);
}

export function showFatalError(error) {
  console.error(error);

  setStatus(
    "error",
    "預約頁開啟失敗",
    error?.message || "系統發生未知錯誤，請稍後再試或聯繫管理者。"
  );
}
