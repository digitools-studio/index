---
name: seo-html-packager
description: Package an approved Digital Studio blog draft into a complete deployable HTML article. Use after editorial review when generating static blog HTML with SEO metadata, canonical URL, Open Graph tags, BlogPosting JSON-LD, table of contents, related articles, CTA, and compatibility with the current static GitHub Pages site.
---

# SEO HTML Packager

## 適用情境

用於已審核文章內容準備轉成完整 HTML 時。預設參考 `templates/blog-article-template.html`，並沿用現有網站 header、footer、Tailwind CDN、Font Awesome、Noto Sans TC 與相對路徑邏輯。

Digital Studio 目前正式 Blog 文章以根目錄 `posts/*.html` 為準，文章清單資料以 `posts/manifest.json` 為準。不要在 `index/posts/` 建立正式文章；若發現同一篇文章同時存在於 `index/posts/` 與 `posts/`，需整併到 `posts/` 並移除多餘副本。

## 輸入

- 已審核文章全文。
- slug。
- SEO title。
- meta description。
- canonical URL。
- published date 與 updated date。
- tag、category、reading time。
- cover image URL 或使用既有 `Static/Image/og-cover.png`。
- 相關文章與 CTA。

## 輸出要求

- 完整 HTML5 文件。
- `<html lang="zh-Hant-TW">`。
- SEO title。
- meta description。
- canonical。
- Open Graph meta tags。
- `BlogPosting` JSON-LD。
- 正確 H1 至 H3 結構。
- 文章目錄。
- 圖片 alt text 預留規範。
- 延伸閱讀區塊。
- 顧問服務 CTA。
- 沿用目前網站 CSS、Header、Footer 與導覽邏輯。
- 不可每篇複製完整 CSS；應引用共用資源，僅保留必要頁面級樣式。
- 若正文資訊量偏高，優先使用文章專屬、scoped 的視覺化模組，例如摘要卡、流程節點、責任矩陣、狀態標籤、導入路線卡、可展開 FAQ。不要只用長段落和大型表格堆疊內容。

## 執行步驟

1. 先確認 repo 現有文章正式位置。若既有文章位於 `posts/*.html`，新文章也建立於 `posts/[slug].html`。
2. 從 `templates/blog-article-template.html` 複製模板內容。
3. 替換所有 `{{PLACEHOLDER}}`。
4. 確認文章只有一個 H1，H2/H3 層級合理。
5. 依 H2 產生文章目錄，錨點需與標題對應。目錄不宜過長；若章節很多，合併成讀者決策路線。
6. 填入 SEO meta、canonical、Open Graph、Twitter card。
7. 建立有效 JSON-LD，日期使用 ISO 格式 `YYYY-MM-DD`。若修改已發布文章，需同步更新 `dateModified`、Open Graph modified time 與 JSON-LD。
8. 確認所有內部路徑符合文章位置；在 `posts/` 內時根目錄資源需用 `../`。
9. 若正式發布文章，更新 `posts/manifest.json` 與 `blog.html` 入口；若另有舊入口頁，確認不會形成重複文章路徑。
10. 保留延伸閱讀與 CTA，不使用 placeholder 文字發布。

## 限制

- 不直接更新 `posts/manifest.json`，除非使用者明確要求發布或整合正式 Blog 入口。
- 不修改 `blog.html`、首頁導覽或部署設定。
- 不新增未審核內文或未驗證外部資料。
- 不把草稿放成正式文章。
- 不把 `articles/drafts/`、研究摘要、草稿審查、QA 工作稿當成正式文章一起提交；正式可發布內容應限於 `posts/*.html`、`posts/manifest.json`、必要入口頁與模板/skill 更新。

## 完成條件

- HTML 可直接在靜態伺服器開啟。
- 所有 SEO 必填欄位存在。
- JSON-LD 是有效 JSON。
- 無 `TODO`、`placeholder` 或未替換的 `{{...}}`。
- 視覺結構與現有文章頁一致。
- 沒有重複正式文章路徑，例如同一篇同時存在 `index/posts/` 與 `posts/`。
