# PDF Stamp & eSign Editor (Mode A)

這是一個單頁 Web 方案：可在 PDF 上加「印章 / 手寫簽名 / 文字」，拖曳調整位置後匯出新版 PDF（可正常開啟與列印）。

本專案 **不使用 npm / bundler / import**；第三方庫採 CDN（pdf.js、pdf-lib）。
你要求的 Python 虛擬環境用法，主要是為了跑本機 http server（避免瀏覽器 worker/CORS 限制）。

---

## 1) 建立 Python 虛擬環境並啟動本機伺服器

### Windows (PowerShell)
```powershell
cd sign-editor
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m http.server 8000
```

### macOS / Linux
```bash
cd sign-editor
python3 -m venv .venv
source .venv/bin/activate
python -m http.server 8000
```

瀏覽器打開：
- http://localhost:8000

### Google 登入／登出完整設定

本專案已完成 Google 登入與登出前端流程，接下來只需要把 Firebase 專案資訊填入同目錄的 `config.js`。

#### Firebase Console 設定步驟

1. 建立 Firebase 專案
2. 到 Authentication → Sign-in method
3. 啟用 Google Provider
4. 到 Project settings → General → Your apps，建立 Web App
5. 複製以下欄位到 `config.js`：
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId
6. 把 `enableGoogleAuth` 改成 `true`
7. 若本機測試，確認 Firebase Authorized domains 中允許 `localhost`

完成後重新整理頁面，即可使用 Google 登入／登出。

---

## 2) 快速測試

1. 點「上傳PDF」
2. 點「內建章」或「上傳印章/章圖」
3. 點「手寫簽名」→ 手寫 →「套用簽名」
4. 點「加入文字」或「加入框框」
5. 選取元素後可調「顏色 / 粗細（框框線寬） / 透明度 / 旋轉」
6. 拖曳 / 縮放 / 鎖定
7. 點「匯出PDF」下載新版 PDF

---

## 3) MVP 設計取捨（你會在意的那種）

- 旋轉時採「rasterize -> embed PNG」的方式，確保跨 PDF Reader 相容性與交付穩定性。
- 這是「視覺簽署」（stamp/signature appearance），不是 PKI/PAdES 可驗證的數位簽章。
