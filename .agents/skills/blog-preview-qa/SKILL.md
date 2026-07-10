---
name: blog-preview-qa
description: Pre-publication QA for Digital Studio static blog articles. Use before publishing or requesting human approval to check HTML structure, SEO metadata, JSON-LD validity, Traditional Chinese quality, evidence risks, links, images, responsive layout risk, current site style compatibility, and unintended production-page changes.
---

# Blog Preview QA

## 適用情境

用於文章 HTML 完成後、正式發布前。目標是找出內容、HTML、SEO 與網站整合風險。

## 輸入

- 文章 HTML 路徑。
- 對應草稿或研究摘要，若有。
- 草稿 00 層與 review 檔，若有。
- 預期 canonical URL。
- 是否準備正式發布。

## 輸出

- QA 結果摘要。
- 阻擋發布的問題。
- 可發布但建議改善的問題。
- 已通過的檢查項。
- 建議下一步。

## 檢查項目

- 草稿 00 層是否仍有會阻擋發布的待確認問題。
- H1 是否唯一。
- SEO title、description、canonical 是否完整。
- JSON-LD 是否為有效 JSON。
- 是否包含未驗證數字或杜撰案例。
- 內外部連結是否合理。
- 圖片與 alt text 是否完整。
- 是否出現簡體字、翻譯腔、TODO、placeholder、未替換 `{{...}}`。
- Header、Footer、CSS 路徑是否正確。
- 手機版是否可能溢位或版面破壞。
- 是否符合目前網站風格。
- 是否不小心修改既有正式頁面。
- 正式文章是否位於目前 repo 的既有正式路徑 `posts/*.html`，而不是誤放到 `index/posts/`。
- Blog 入口是否只有根目錄 `blog.html`；不得建立或保留 `index/blog.html` 作為第二個索引。
- `blog.html`、`posts/manifest.json`、`sitemap.xml`、canonical、OG URL、JSON-LD URL 是否全部指向同一組正式路徑。
- `posts/manifest.json` 每篇文章是否都有明確 `href`，且該檔案存在。
- 是否存在重複文章副本或空的過渡資料夾，例如同一 slug 同時出現在 `index/posts/` 與 `posts/`。
- 是否有非正式文章內容準備被提交，例如 `articles/drafts/` 下的 content angle、research brief、SEO brief、full draft、review 或 QA 工作檔。
- 文章內容是否過長且缺乏掃描性；若正文密度過高，建議改成摘要卡、流程節點、狀態標籤、導入路線卡或可展開 FAQ。
- 正式文章正文是否誤放 research brief 語氣，例如「根據某官方文件...查詢日期...」；若有，應改成自然顧問式敘述，必要來源放文末。

## 執行步驟

1. 先讀草稿 00 層與 review 檔。若仍有會影響內容正確性、CTA、slug、來源、法律提醒或正式路徑的待確認問題，列為阻擋發布。
2. 讀取 HTML，檢查基本結構與必備 meta。
3. 擷取 JSON-LD 並確認可被 JSON parser 解析。
4. 檢查 H1 數量與 H2/H3 層級。
5. 搜尋 `TODO`、`placeholder`、`{{`、`}}`、簡體高風險字詞與禁用詞。
6. 檢查內部連結與資源路徑是否符合檔案位置。
7. 檢查圖片是否有 `alt`，裝飾圖需明確 `alt=""`。
8. 檢查文中外部事實是否有來源與查詢日期。
9. 檢查 Blog 路徑整合：`blog.html` 是唯一文章索引；`posts/[slug].html`、`posts/manifest.json`、`sitemap.xml`、canonical、OG URL 與 JSON-LD 必須一致；manifest 每篇文章需有明確 `href` 且檔案存在；不得留下 `index/blog.html`、`index/posts` 之類舊路徑入口。
10. 檢查 `git status` 與 `git diff`，確認未意外修改首頁、服務頁、部署設定或既有正式文章；同時確認 `articles/drafts/` 等非正式文章內容不會被 commit。
11. 檢查正式文章正文是否把來源名稱、查詢日期、可信度寫成段落主體；若不是法律、價格、版本等必要引用，改以中性說法或文末來源處理。
12. 若可用，啟動本機靜態伺服器並用瀏覽器檢查桌機與手機寬度。

## 限制

- 不自動發布。
- 不自行補外部數據。
- 不修改正式頁面，除非使用者明確要求。
- 若發現阻擋發布問題，先回報並修草稿或模板。
- 不把 QA 工作檔或草稿檔當成正式發布成果。若需要保留，應留在本機或確認 `.gitignore`。

## 完成條件

- 草稿 00 層沒有阻擋發布的未決事項，或 QA 報告已明確列出不可發布原因。
- 沒有阻擋發布問題。
- SEO、JSON-LD、結構、語言、連結與路徑檢查通過。
- 若未執行瀏覽器預覽，需明確說明原因與替代檢查。
- `git status` 中可發布檔案與非正式工作稿已清楚區分；正式文章沒有重複路徑。
- `sitemap.xml` 已列出正式 Blog 索引與正式文章頁，沒有列出被移除的過渡路徑。
