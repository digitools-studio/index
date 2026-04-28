window.APP_CONFIG = {
  appName: "SignFlow PDF",

  // 填入你的 email，表單送出後會透過 mailto: 開啟郵件用戶端以收到諮詢需求
  // 若留空則僅保存至本機 localStorage（可在瀏覽器開發者工具 > Application > Local Storage 查閱）
  inquiryEmail: "",

  firebase: {
    // 完成 Firebase 設定後，改成 true 即可啟用 Google 登入
    enableGoogleAuth: false,

    // 到 Firebase Console > 專案設定 > 一般 > 你的應用程式 取得以下欄位
    apiKey: "PASTE_FIREBASE_API_KEY_HERE",
    authDomain: "PASTE_FIREBASE_AUTH_DOMAIN_HERE",
    projectId: "PASTE_FIREBASE_PROJECT_ID_HERE",
    storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET_HERE",
    messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID_HERE",
    appId: "PASTE_FIREBASE_APP_ID_HERE"
  }
};
