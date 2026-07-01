---
name: source-research-brief
description: Create a verifiable research brief for Digital Studio blog articles. Use before drafting articles that mention external facts, market numbers, laws, product specifications, API behavior, technical versions, pricing, benchmarks, or third-party claims.
---

# Source Research Brief

## 適用情境

用於文章草稿前，建立可查證研究摘要，避免把推測、顧問觀點或假設情境寫成事實。

## 輸入

- 文章主題或 content-angle 輸出。
- 需要查證的問題清單。
- 可使用或不可使用的來源範圍，若有。

## 輸出格式

```markdown
## 主題

## 已驗證事實

| 事實 | 來源 | 查詢日期 | 可信度 | 使用限制 |
| --- | --- | --- | --- | --- |

## 可使用的數據

## 尚未確認的資訊

## Digital Studio 的原創顧問觀點

## 不可使用或需避免的說法
```

研究摘要與草稿屬於非正式文章內容，預設只放在本機 `articles/drafts/` 或同等工作目錄，不應作為正式發布內容提交到 GitHub Pages。正式文章只引用必要來源摘要，不把完整研究過程搬進 production HTML。

## 執行步驟

1. 從題目中列出所有可能涉及外部事實的主張。
2. 優先查官方文件、原始公告、法規原文、研究報告或產品文件。
3. 為每項事實記錄來源、URL、查詢日期與可信度。
4. 將「已驗證事實」與「Digital Studio 顧問觀點」分開。
5. 將沒有足夠來源的內容放入「尚未確認的資訊」。
6. 列出不可使用或需避免的說法，例如過度推論、無來源數據、法律結論。
7. 標記哪些來源需要進正式文章的「資料來源」區塊，哪些只作為內部研究依據。正式文章避免用「已驗證事實」反覆打斷正文閱讀。

## 可信度標準

- 高：官方文件、法規原文、原始研究、公司正式公告。
- 中：可信媒體、專業機構整理、具來源鏈接的技術文章。
- 低：無來源部落格、論壇、二手整理、社群貼文。

## 限制

- 不把低可信度來源當成事實基礎。
- 不使用過期產品規格，除非文章明確討論歷史版本。
- 不產生正式文章。
- 不將假設情境包裝成案例。
- 不要求提交研究摘要、草稿、QA 過程檔到正式 GitHub Pages repo；若 repo 需要保留工作稿，應先確認 `.gitignore` 或 commit 範圍。

## 完成條件

- 每個外部事實都有來源與查詢日期。
- 未確認資訊被清楚標示。
- 可使用數據的限制與上下文清楚。
- 顧問觀點與外部事實沒有混在一起。
