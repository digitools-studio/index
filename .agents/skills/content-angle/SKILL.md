---
name: content-angle
description: Turn a Digital Studio blog topic into a consultative article strategy. Use when planning Traditional Chinese blog articles about digital transformation, systems analysis, AI Native product development, MVP planning, process optimization, ecommerce automation, AWS architecture, or software consulting.
---

# Content Angle

## 適用情境

用於收到 Blog 題目、關鍵字、客戶問題或初步文章方向時，先建立文章策略，不直接寫正式文章。

## 輸入

- 題目或關鍵字。
- 目標服務或產品，若有。
- 讀者背景，若有。
- 已知限制，例如不可使用未驗證數字、不可提特定客戶。

## 輸出

以繁體中文輸出：

- 若是新文章草稿專案，先建立或確認 `articles/drafts/[slug]/00-feedback-inbox.md`、`00-decision-log.md`、`00-workflow-state.md`；可參考 `articles/drafts/_template/` 的 00 層範本。
- 目標讀者。
- 核心痛點。
- 讀者常見誤區。
- 文章核心主張。
- 建議標題，至少 3 個。
- H2 架構。
- 建議視覺化模組，例如流程圖、對照表、檢查卡、導入路線、FAQ 摺疊區。
- 可延伸文章。
- CTA 建議。

## 執行步驟

1. 判斷題目屬於哪個內容支柱；若不明確，參考 `docs/content-pillars.md`。
2. 建立草稿回饋分層：`00-feedback-inbox.md` 保留使用者原始回饋、`00-decision-log.md` 整理已確認決策與待確認問題、`00-workflow-state.md` 記錄目前階段與不可做事項。可從 `articles/drafts/_template/` 複製起始結構；使用者提供純文字時，不要求先改成 Markdown。
3. 若是在既有草稿上迭代，先讀 00 層，再讀既有 `01-content-angle.md`，把新回饋整理到 00 層後才更新 content angle。
4. 將題目改寫成讀者正在面對的決策問題。
5. 找出讀者常見誤區，避免只整理知識點。
6. 建立一個清楚的顧問觀點：什麼情境適合、什麼情境不適合、先做什麼。
7. 設計 H2，順序應從情境、問題、判斷標準、執行方式、風險、下一步展開。
8. 預先判斷哪些內容應用視覺化承載。若題目容易變成長篇流程文，優先規劃「先給答案」摘要卡、流程節點、Before/After、責任矩陣與分階段導入卡，避免正式文章變成過量正文。
9. 提出可延伸文章，讓 Blog 可以形成系列。
10. 提出 CTA，連回 Digital Studio 可協助的具體工作。
11. 完成後明確列出需要使用者回饋的事項，並標示每一項回饋會更新哪個草稿檔。

## 限制

- 不輸出正式文章內文。
- 不編造市場數據、客戶案例或成效。
- 不使用空泛 AI 行銷詞。
- 若需要外部事實，標示「需研究確認」，交給 `source-research-brief`。

## 完成條件

- 00 層已建立或已讀取，純文字回饋已被整理成決策、待確認問題與對應更新位置。
- 文章核心主張可以用一句話說清楚。
- H2 架構能支撐一篇完整文章，不只是關鍵字堆疊。
- 文章策略已標示哪些資訊適合正文、哪些資訊適合視覺模組，避免後續 HTML 包裝時才大量重工。
- CTA 與讀者問題自然相連。
- 所有需查證的外部事實已被標示。
