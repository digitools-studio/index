# 小型服務業預約營運 OS｜LINE LIFF + Cal.com Embed

這是一個可直接部署到 GitHub Pages 的靜態前端專案，用於：

- LINE OA 圖文選單 → LIFF 預約頁
- IG Bio → LIFF 預約頁
- 官網 → Cal.com Embed 預約頁
- 來源追蹤：source / medium / campaign / placement
- LINE 使用者身份中繼：lineUserId / lineDisplayName
- Cal.com metadata 傳遞給 Webhook / Make.com
- Debug 模式檢查 metadata 是否正確

## 重要原則

本專案不放任何私密金鑰。

可以放在前端：
- LIFF ID
- Cal.com 公開預約連結
- source tracking 參數

不能放在前端：
- LINE Channel Access Token
- Cal.com API Key
- Google API Secret
- Make.com 管理金鑰

LINE Push Message 必須由 Make.com 或後端執行，不要由 GitHub Pages 前端直接呼叫。

---

## 檔案結構

```text
booking-ops-liff-github-pages/
├─ index.html
├─ liff-booking.html
├─ website-booking.html
├─ privacy.html
├─ .nojekyll
├─ assets/
│  └─ styles.css
├─ src/
│  ├─ config.js
│  ├─ tracking.js
│  ├─ liff-profile.js
│  ├─ calcom-embed.js
│  ├─ ui.js
│  ├─ app-liff.js
│  └─ app-website.js
├─ calcom-payloads/
│  └─ booking-created-payload-template.json
└─ docs/
   ├─ GITHUB_PAGES_SETUP.md
   ├─ LINE_LIFF_SETUP.md
   ├─ URL_TRACKING_SPEC.md
   └─ TESTING_CHECKLIST.md
```

---

## 你一定要先改的設定

請打開：

```text
src/config.js
```

修改：

```js
LIFF_ID: "REPLACE_WITH_LIFF_ID",
CALCOM_EVENT_URL: "https://cal.com/your-brand/consultation",
```

範例：

```js
LIFF_ID: "2001234567-AbCdEfGh",
CALCOM_EVENT_URL: "https://cal.com/ken/demo-booking",
```

---

## GitHub Pages 建議部署方式

1. 建立 GitHub repo，例如 `booking-ops-liff`
2. 把本專案所有檔案上傳到 repo 根目錄
3. 到 repo `Settings` → `Pages`
4. Source 選 `Deploy from a branch`
5. Branch 選 `main` / root
6. 取得公開網址，例如：

```text
https://yourname.github.io/booking-ops-liff/
```

LIFF Endpoint 建議設定成：

```text
https://yourname.github.io/booking-ops-liff/liff-booking.html
```

---

## LINE OA 圖文選單 URL 範例

```text
https://liff.line.me/{LIFF_ID}?src=line_oa&medium=richmenu&campaign=booking_main&placement=richmenu_booking
```

## IG Bio URL 範例

```text
https://liff.line.me/{LIFF_ID}?src=instagram&medium=bio_link&campaign=booking_main&placement=ig_profile
```

## 官網直接預約 URL 範例

```text
https://yourname.github.io/booking-ops-liff/website-booking.html?src=official_site&medium=homepage_cta&campaign=booking_main&placement=home_hero
```

---

## Debug 模式

在網址後方加：

```text
&debug=true
```

範例：

```text
https://liff.line.me/{LIFF_ID}?src=line_oa&medium=richmenu&campaign=booking_main&placement=richmenu_booking&debug=true
```

畫面會顯示即將送進 Cal.com metadata 的資料。


---

## 目前已接入的 Cal.com 預約連結

```text
https://cal.com/digital-studio-gtrwkk/30min
```

目前 Cal.com Embed 設定：

```js
CALCOM_EVENT_URL: "https://cal.com/digital-studio-gtrwkk/30min"
CALCOM_NAMESPACE: "30min"
CALCOM_ORIGIN: "https://app.cal.com"
CALCOM_EMBED_SCRIPT_URL: "https://app.cal.com/embed/embed.js"
CALCOM_USE_SLOTS_VIEW_ON_SMALL_SCREEN: "true"
CALCOM_FORWARD_QUERY_PARAMS: true
```

官網預約頁測試 URL：

```text
https://digitools-studio.github.io/index/booking-ops-liff-github-pages/website-booking.html?src=official_site&medium=homepage_cta&campaign=booking_main&placement=home_hero&debug=true
```
