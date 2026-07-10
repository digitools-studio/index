---
name: seo-html-packager
description: Package an approved Digital Studio blog draft into a complete deployable HTML article. Use after editorial review when generating static blog HTML with SEO metadata, canonical URL, Open Graph tags, BlogPosting JSON-LD, table of contents, related articles, CTA, and compatibility with the current static GitHub Pages site.
---

# SEO HTML Packager

## 適用情境

用於已審核文章內容準備轉成完整 HTML 時。預設參考 `templates/blog-article-template.html`，並沿用現有網站 header、footer、Tailwind CDN、Font Awesome、Noto Sans TC 與相對路徑邏輯。

Digital Studio 目前正式 Blog 結構為：根目錄 `blog.html` 是唯一文章索引，正式文章細節頁位於根目錄 `posts/*.html`，文章清單資料位於 `posts/manifest.json`。不要建立 `index/blog.html` 或 `index/posts/` 作為正式 Blog 路徑；若發現重複入口，需整併到 `blog.html` 與 `posts/` 並移除多餘副本。

## 輸入

- 已審核文章全文。
- 草稿 00 層與 review 檔，確認使用者回饋已處理且文章已核准進入 HTML。
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
- 正式文章正文不可直接搬入研究 brief 的引用語氣，例如「根據某官方文件...查詢日期...」。需要引用外部事實時，正文用自然語氣說明，來源集中放在文末「資料來源」區塊；若工具能力不是文章核心，優先改成中性描述並省略具名工具。

## 執行步驟

1. 先讀草稿 00 層、完整草稿與草稿 review。若 `00-decision-log.md` 仍有會影響內容、CTA、slug、來源或結構的待確認問題，不進入正式 HTML。
2. 先確認 repo 現有 Blog 結構。Digital Studio Blog 以 `blog.html` 作為唯一索引；若既有文章位於 `posts/*.html`，新文章也建立於 `posts/[slug].html`。
3. 從 `templates/blog-article-template.html` 複製模板內容。
4. 替換所有 `{{PLACEHOLDER}}`。
5. 確認文章只有一個 H1，H2/H3 層級合理。
6. 依 H2 產生文章目錄，錨點需與標題對應。目錄不宜過長；若章節很多，合併成讀者決策路線。
7. 填入 SEO meta、canonical、Open Graph、Twitter card。
8. 建立有效 JSON-LD，日期使用 ISO 格式 `YYYY-MM-DD`。若修改已發布文章，需同步更新 `dateModified`、Open Graph modified time 與 JSON-LD。
9. 確認所有內部路徑符合文章位置；在 `posts/` 內時根目錄資源需用 `../`。
10. 若正式發布文章，更新 `posts/manifest.json`、`blog.html` 入口與 `sitemap.xml`；manifest 每篇文章應有明確 `href`，不要只依賴前端 fallback；確認不會產生 `index/blog.html`、`index/posts/` 或其他重複文章路徑。
11. 保留延伸閱讀與 CTA，不使用 placeholder 文字發布。
12. 將研究摘要轉成讀者需要的判斷，不把「來源名稱、查詢日期、可信度」寫進一般正文段落。若正式文章保留資料來源，放在文末短區塊即可。

## 限制

- 不直接更新 `posts/manifest.json`，除非使用者明確要求發布或整合正式 Blog 入口。
- 不修改 `blog.html`、首頁導覽或部署設定。
- 不新增未審核內文或未驗證外部資料。
- 不把草稿放成正式文章。
- 不把 `articles/drafts/`、研究摘要、草稿審查、QA 工作稿當成正式文章一起提交；正式可發布內容應限於 `posts/*.html`、`posts/manifest.json`、必要入口頁與模板/skill 更新。
- 不把 research brief 的表格、查詢日期、可信度、引用格式原樣搬入正式正文。

## 完成條件

- 草稿 00 層中的發布前待確認事項已關閉，或明確標示不阻擋 HTML 包裝。
- HTML 可直接在靜態伺服器開啟。
- 所有 SEO 必填欄位存在。
- JSON-LD 是有效 JSON。
- 無 `TODO`、`placeholder` 或未替換的 `{{...}}`。
- 視覺結構與現有文章頁一致。
- 沒有重複正式文章路徑，例如同一篇同時存在 `index/posts/` 與 `posts/`。
- 沒有多餘 Blog 索引，例如 `index/blog.html`；正式索引只能是根目錄 `blog.html`。
