---
name: zh-hant-tw-editor
description: Edit Digital Studio article drafts into natural, professional Taiwan Traditional Chinese. Use for zh-Hant-TW copyediting, terminology normalization, removing Simplified Chinese/Mainland phrasing/translationese, and keeping a consultative tone for blog articles, landing pages, and technical explanations.
---

# zh-Hant-TW Editor

## 適用情境

用於文章草稿完成後，將文字調整成自然、專業、符合台灣讀者習慣的繁體中文。

需要詞彙選擇時，讀取 `references/terminology.md`。

## 輸入

- 文章草稿。
- 草稿 00 層，包含使用者原始回饋、已確認決策、待確認問題與目前階段，若已存在。
- 文章目標讀者與核心主張，若有。
- 必須保留的技術名詞或 SEO 關鍵字。

## 輸出

- 編修後全文，或依使用者要求輸出修改建議。
- 如有高風險事實、未驗證數據、疑似杜撰案例，需另外列出。

## 執行步驟

1. 先讀草稿 00 層與目前草稿。若使用者純文字回饋包含語氣、讀者、刪減、補強或禁用說法，先整理到 `00-decision-log.md`。
2. 檢查是否有簡體字、陸用詞、翻譯腔或不自然句式。
3. 移除空泛詞，例如「賦能、抓手、閉環、痛點抓取、數據化賦能」。
4. 優先使用台灣常用詞：資料、流程、需求、導入、使用者、客戶、程式碼、部署、網站。
5. 技術術語第一次出現時，補一句白話解釋。
6. 每段至少保留一個具體情境、判斷、案例或可執行建議。
7. 若文章內容過多，優先做「降密度編輯」：合併重複段落、保留核心判斷，將長清單改成摘要卡、流程圖、對照區、狀態標籤或可展開 FAQ。
8. 語氣維持顧問式、理性、有觀點，但不要過度銷售。
9. 標示需要來源的外部主張，不自行補數字。
10. 完成後回報已吸收哪些使用者回饋、哪些回饋因缺少事實或決策仍需確認。

## 限制

- 不改變已確認的技術事實。
- 不新增未查證數字或案例。
- 不把假設情境改寫成真實案例。
- 不為了 SEO 堆疊關鍵字。
- 不把內部研究摘要、草稿審查或 QA 筆記混入正式文章正文；正式文章只保留讀者需要的判斷、來源與下一步。

## 完成條件

- 使用者回饋已先被整理到 00 層，且編修結果可追溯到已確認決策。
- 全文為台灣繁體中文。
- 沒有明顯陸用詞、簡體字或翻譯腔。
- 段落具體且能支持文章主張。
- 需要來源的內容已被標示。
- 文章在資訊完整與可讀性之間取得平衡；過長內容已被視覺化或收斂。
