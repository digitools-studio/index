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
- 預期 canonical URL。
- 是否準備正式發布。

## 輸出

- QA 結果摘要。
- 阻擋發布的問題。
- 可發布但建議改善的問題。
- 已通過的檢查項。
- 建議下一步。

## 檢查項目

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
- Blog 入口、`posts/manifest.json`、canonical、OG URL、JSON-LD URL 是否全部指向同一個正式路徑。
- 是否存在重複文章副本或空的過渡資料夾，例如同一 slug 同時出現在 `index/posts/` 與 `posts/`。
- 是否有非正式文章內容準備被提交，例如 `articles/drafts/` 下的 content angle、research brief、SEO brief、full draft、review 或 QA 工作檔。
- 文章內容是否過長且缺乏掃描性；若正文密度過高，建議改成摘要卡、流程節點、狀態標籤、導入路線卡或可展開 FAQ。

## 執行步驟

1. 讀取 HTML，檢查基本結構與必備 meta。
2. 擷取 JSON-LD 並確認可被 JSON parser 解析。
3. 檢查 H1 數量與 H2/H3 層級。
4. 搜尋 `TODO`、`placeholder`、`{{`、`}}`、簡體高風險字詞與禁用詞。
5. 檢查內部連結與資源路徑是否符合檔案位置。
6. 檢查圖片是否有 `alt`，裝飾圖需明確 `alt=""`。
7. 檢查文中外部事實是否有來源與查詢日期。
8. 檢查 Blog 路徑整合：`posts/[slug].html`、`posts/manifest.json`、`blog.html`、canonical、OG URL 與 JSON-LD 必須一致；不得留下 `index/posts` 之類舊路徑入口。
9. 檢查 `git status` 與 `git diff`，確認未意外修改首頁、服務頁、部署設定或既有正式文章；同時確認 `articles/drafts/` 等非正式文章內容不會被 commit。
10. 若可用，啟動本機靜態伺服器並用瀏覽器檢查桌機與手機寬度。

## 限制

- 不自動發布。
- 不自行補外部數據。
- 不修改正式頁面，除非使用者明確要求。
- 若發現阻擋發布問題，先回報並修草稿或模板。
- 不把 QA 工作檔或草稿檔當成正式發布成果。若需要保留，應留在本機或確認 `.gitignore`。

## 完成條件

- 沒有阻擋發布問題。
- SEO、JSON-LD、結構、語言、連結與路徑檢查通過。
- 若未執行瀏覽器預覽，需明確說明原因與替代檢查。
- `git status` 中可發布檔案與非正式工作稿已清楚區分；正式文章沒有重複路徑。
