(() => {
  "use strict";

  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    alert("pdf.js 未載入成功。請確認網路可連線到 CDN，或改成本地 vendor 檔案。");
    return;
  }

  const USER_CONFIG = window.APP_CONFIG || {};
  const APP_CONFIG = {
    appName: USER_CONFIG.appName || "SignFlow PDF",
    inquiryEmail: USER_CONFIG.inquiryEmail || ""
  };

  const state = {
    pdfDoc: null,
    pdfBytes: null,
    pageCount: 0,
    pageIndex: 0,
    zoom: 1.0,
    pagesMeta: [],
    annotations: [],
    selectedId: null,
    history: { undo: [], redo: [] },
    currentDocId: null,
    docName: "",
    isDirty: false,
    storageReady: false,
    auth: {
      user: null,
      busy: false,
    },
  };

  const dom = {
    fileInput: document.getElementById("fileInput"),
    stampInput: document.getElementById("stampInput"),
    pdfCanvas: document.getElementById("pdfCanvas"),
    centerpanel: document.querySelector(".centerpanel"),
    overlay: document.getElementById("overlay"),
    guides: document.getElementById("guides"),
    stage: document.getElementById("stage"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    btnZoomIn: document.getElementById("btnZoomIn"),
    btnZoomOut: document.getElementById("btnZoomOut"),
    btnAddSign: document.getElementById("btnAddSign"),
    btnAddText: document.getElementById("btnAddText"),
    btnAddRect: document.getElementById("btnAddRect"),
    btnUndo: document.getElementById("btnUndo"),
    btnRedo: document.getElementById("btnRedo"),
    btnExport: document.getElementById("btnExport"),
    pageLabel: document.getElementById("pageLabel"),
    zoomLabel: document.getElementById("zoomLabel"),
    opacityRange: document.getElementById("opacityRange"),
    opacityLabel: document.getElementById("opacityLabel"),
    rotateRange: document.getElementById("rotateRange"),
    rotateLabel: document.getElementById("rotateLabel"),
    colorInput: document.getElementById("colorInput"),
    colorLabel: document.getElementById("colorLabel"),
    thicknessRange: document.getElementById("thicknessRange"),
    thicknessLabel: document.getElementById("thicknessLabel"),
    btnBringFront: document.getElementById("btnBringFront"),
    btnSendBack: document.getElementById("btnSendBack"),
    btnLock: document.getElementById("btnLock"),
    btnDelete: document.getElementById("btnDelete"),
    signDialog: document.getElementById("signDialog"),
    signCanvas: document.getElementById("signCanvas"),
    btnSignClose: document.getElementById("btnSignClose"),
    btnSignClear: document.getElementById("btnSignClear"),
    btnSignUse: document.getElementById("btnSignUse"),
    authModeBadge: document.getElementById("authModeBadge"),
    authStatus: document.getElementById("authStatus"),
    btnLoginGoogle: document.getElementById("btnLoginGoogle"),
    btnLogout: document.getElementById("btnLogout"),
    docNameInput: document.getElementById("docNameInput"),
    btnSaveDraft: document.getElementById("btnSaveDraft"),
    saveStatus: document.getElementById("saveStatus"),
    docList: document.getElementById("docList"),
    docEmpty: document.getElementById("docEmpty"),
  };

  const uid = () => "a_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const normalizeHexColor = (c, fallback = "#111111") => {
    if (typeof c !== "string") return fallback;
    const m = c.trim().match(/^#([0-9a-fA-F]{6})$/);
    return m ? `#${m[1].toLowerCase()}` : fallback;
  };
  const hexToRgb01 = (hex) => {
    const c = normalizeHexColor(hex, "#111111");
    const r = parseInt(c.slice(1, 3), 16) / 255;
    const g = parseInt(c.slice(3, 5), 16) / 255;
    const b = parseInt(c.slice(5, 7), 16) / 255;
    return { r, g, b };
  };
  const normalizeDeg = (d) => {
    let x = d % 360;
    if (x > 180) x -= 360;
    if (x < -180) x += 360;
    return x;
  };
  const safeDocName = (name) => (String(name || "未命名文件").replace(/\.pdf$/i, "").trim() || "未命名文件");
  const formatTime = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("zh-TW", { hour12: false });
    } catch {
      return String(iso);
    }
  };

  function getAnno(id) { return state.annotations.find((a) => a.id === id); }
  function getSelected() { return state.selectedId ? getAnno(state.selectedId) : null; }
  function pageMeta(i) { return state.pagesMeta[i]; }
  function snapshotAnno(a) { return clone(a); }
  function bytesFromStorage(stored) {
    if (!stored) return null;
    if (stored instanceof Uint8Array) return stored.slice();
    if (stored instanceof ArrayBuffer) return new Uint8Array(stored);
    if (Array.isArray(stored)) return new Uint8Array(stored);
    return null;
  }


  const DataStore = {
    db: null,
    async init() {
      if (this.db) return this.db;
      if (!("indexedDB" in window)) {
        throw new Error("此瀏覽器不支援 IndexedDB");
      }
      return await new Promise((resolve, reject) => {
        const req = window.indexedDB.open("signflow-pdf-editor", 2);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("docs")) {
            db.createObjectStore("docs", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("assets")) {
            db.createObjectStore("assets", { keyPath: "id" });
          }
        };
        req.onsuccess = () => {
          this.db = req.result;
          resolve(this.db);
        };
        req.onerror = () => reject(req.error || new Error("IndexedDB 初始化失敗"));
      });
    },
    async putDoc(doc) {
      const db = await this.init();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("docs", "readwrite");
        const store = tx.objectStore("docs");
        const req = store.put(doc);
        req.onsuccess = () => resolve(doc);
        req.onerror = () => reject(req.error || new Error("保存草稿失敗"));
      });
    },
    async getDoc(id) {
      const db = await this.init();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("docs", "readonly");
        const store = tx.objectStore("docs");
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error || new Error("讀取草稿失敗"));
      });
    },
    async deleteDoc(id) {
      const db = await this.init();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("docs", "readwrite");
        const store = tx.objectStore("docs");
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error || new Error("刪除草稿失敗"));
      });
    },
    async listDocs(ownerId) {
      const db = await this.init();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("docs", "readonly");
        const store = tx.objectStore("docs");
        const req = store.getAll();
        req.onsuccess = () => {
          const docs = (req.result || [])
            .filter((doc) => !ownerId || doc.ownerId === ownerId)
            .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
          resolve(docs);
        };
        req.onerror = () => reject(req.error || new Error("讀取文件清單失敗"));
      });
    },
    async putAsset(asset) {
      const db = await this.init();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("assets", "readwrite");
        const store = tx.objectStore("assets");
        const req = store.put(asset);
        req.onsuccess = () => resolve(asset);
        req.onerror = () => reject(req.error || new Error("保存資產失敗"));
      });
    },
    async deleteAsset(id) {
      const db = await this.init();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("assets", "readwrite");
        const store = tx.objectStore("assets");
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error || new Error("刪除資產失敗"));
      });
    },
    async listAssets(ownerId) {
      const db = await this.init();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("assets", "readonly");
        const store = tx.objectStore("assets");
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result || [])
            .filter((item) => !ownerId || item.ownerId === ownerId)
            .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
          resolve(items);
        };
        req.onerror = () => reject(req.error || new Error("讀取資產列表失敗"));
      });
    }
  };

  const Docs = {
    autosaveTimer: null,
    ownerId() {
      return state.auth.user?.email || "guest@local";
    },
    async init() {
      try {
        await DataStore.init();
        state.storageReady = true;
      } catch (err) {
        console.error("Storage init failed:", err);
        state.storageReady = false;
      }
      await this.refreshList();
    },
    markDirty() {
      if (!state.pdfDoc || !state.storageReady) return;
      state.isDirty = true;
      UI.setSaveStatus("編輯中...");
      this.queueAutosave();
    },
    queueAutosave() {
      if (!state.storageReady || !state.pdfBytes) return;
      window.clearTimeout(this.autosaveTimer);
      this.autosaveTimer = window.setTimeout(() => {
        this.saveCurrent({ silent: true }).catch((err) => {
          console.error("Autosave failed:", err);
          UI.setSaveStatus("自動保存失敗");
        });
      }, 700);
    },
    async saveCurrent({ silent = false } = {}) {
      if (!state.storageReady) {
        UI.setSaveStatus("目前瀏覽器不支援草稿保存");
        return;
      }
      if (!state.pdfBytes) return;

      const now = new Date().toISOString();
      state.currentDocId = state.currentDocId || uid();
      const existing = await DataStore.getDoc(state.currentDocId);
      const name = safeDocName(dom.docNameInput?.value || state.docName || "未命名文件");
      const doc = {
        id: state.currentDocId,
        ownerId: this.ownerId(),
        name,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        pdfBytes: state.pdfBytes.slice().buffer,
        annotations: clone(state.annotations),
        pageIndex: state.pageIndex,
        zoom: state.zoom,
      };
      await DataStore.putDoc(doc);
      state.docName = name;
      state.isDirty = false;
      if (dom.docNameInput) dom.docNameInput.value = name;
      UI.setSaveStatus(silent ? "已自動保存" : "草稿已保存");
      await this.refreshList();
    },
    async refreshList() {
      if (!dom.docList || !dom.docEmpty) return;
      if (!state.storageReady) {
        dom.docList.innerHTML = "";
        dom.docEmpty.hidden = false;
        dom.docEmpty.textContent = "目前瀏覽器不支援本機草稿保存。";
        return;
      }
      try {
        const docs = await DataStore.listDocs(this.ownerId());
        dom.docList.innerHTML = "";
        dom.docEmpty.hidden = docs.length > 0;
        dom.docEmpty.textContent = "尚無文件草稿。上傳 PDF 後會自動建立本機草稿。";

        for (const doc of docs) {
          const item = document.createElement("div");
          item.className = "doc-item";

          const main = document.createElement("div");
          main.className = "doc-main";

          const title = document.createElement("div");
          title.className = "doc-title";
          title.textContent = doc.name || "未命名文件";

          const meta = document.createElement("div");
          meta.className = "doc-meta";
          meta.textContent = `最後更新：${formatTime(doc.updatedAt)}`;

          main.appendChild(title);
          main.appendChild(meta);

          const actions = document.createElement("div");
          actions.className = "doc-actions";

          const openBtn = document.createElement("button");
          openBtn.className = "btn small";
          openBtn.textContent = "開啟";
          openBtn.addEventListener("click", async () => { await this.openDoc(doc.id); });

          const renameBtn = document.createElement("button");
          renameBtn.className = "btn small";
          renameBtn.textContent = "改名";
          renameBtn.addEventListener("click", async () => { await this.renameDoc(doc.id); });

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "btn small danger";
          deleteBtn.textContent = "刪除";
          deleteBtn.addEventListener("click", async () => { await this.deleteDoc(doc.id); });

          actions.appendChild(openBtn);
          actions.appendChild(renameBtn);
          actions.appendChild(deleteBtn);

          item.appendChild(main);
          item.appendChild(actions);
          dom.docList.appendChild(item);
        }
      } catch (err) {
        console.error("Refresh docs failed:", err);
        dom.docList.innerHTML = "";
        dom.docEmpty.hidden = false;
        dom.docEmpty.textContent = "文件列表讀取失敗。";
      }
    },
    async openDoc(id) {
      const doc = await DataStore.getDoc(id);
      if (!doc) {
        alert("找不到該草稿。請重新整理後再試一次。");
        await this.refreshList();
        return;
      }
      await PDFEngine.loadFromStoredDoc(doc);
      UI.setSaveStatus("已開啟草稿");
    },
    async renameDoc(id) {
      const doc = await DataStore.getDoc(id);
      if (!doc) return;
      const next = prompt("重新命名文件：", doc.name || "");
      if (next === null) return;
      doc.name = safeDocName(next);
      doc.updatedAt = new Date().toISOString();
      await DataStore.putDoc(doc);
      if (state.currentDocId === id) {
        state.docName = doc.name;
        if (dom.docNameInput) dom.docNameInput.value = doc.name;
        UI.setSaveStatus("文件名稱已更新");
      }
      await this.refreshList();
    },
    async deleteDoc(id) {
      const doc = await DataStore.getDoc(id);
      if (!doc) return;
      const ok = window.confirm(`確定要刪除「${doc.name || "未命名文件"}」嗎？`);
      if (!ok) return;
      await DataStore.deleteDoc(id);
      if (state.currentDocId === id) {
        PDFEngine.resetWorkspace("文件已刪除，請上傳或開啟其他草稿");
      }
      await this.refreshList();
    }
  };

  const Assets = {
    ownerId() {
      return state.auth.user?.email || "guest@local";
    },
    isSavableAnno(a) {
      return !!a && (a.type === "stamp" || a.type === "signature") && !!a.dataUrl;
    },
    defaultName(prefix = "我的資產") {
      const input = (dom.assetNameInput?.value || "").trim();
      if (input) return input;
      return `${prefix}-${new Date().toLocaleDateString("zh-TW")}`;
    },
    async saveFromSelected() {
      const a = getSelected();
      if (!this.isSavableAnno(a)) {
        alert("請先選取印章或簽名，再加入資產庫。");
        return;
      }
      const asset = {
        id: uid(),
        ownerId: this.ownerId(),
        name: this.defaultName(a.type === "signature" ? "我的簽名" : "我的印章"),
        type: a.type,
        dataUrl: a.dataUrl,
        updatedAt: new Date().toISOString(),
      };
      await DataStore.putAsset(asset);
      if (dom.assetNameInput) dom.assetNameInput.value = "";
      UI.setSaveStatus("已收藏到資產庫");
      await this.refreshList();
    },
    async saveSignatureDataUrl(dataUrl) {
      if (!dataUrl || SignaturePad.isBlank()) {
        alert("請先在簽名板上寫入簽名內容。");
        return;
      }
      const asset = {
        id: uid(),
        ownerId: this.ownerId(),
        name: this.defaultName("我的簽名"),
        type: "signature",
        dataUrl,
        updatedAt: new Date().toISOString(),
      };
      await DataStore.putAsset(asset);
      if (dom.assetNameInput) dom.assetNameInput.value = "";
      UI.setSaveStatus("簽名已收藏");
      await this.refreshList();
    },
    async applyAsset(id) {
      const items = await DataStore.listAssets(this.ownerId());
      const asset = items.find((item) => item.id === id);
      if (!asset) return;
      if (!state.pdfDoc) {
        alert("請先上傳或開啟 PDF，再套用資產。");
        return;
      }
      await addImageAnno(asset.type || "stamp", asset.dataUrl, 240, 240, true);
      UI.setSaveStatus("已套用資產");
    },
    async deleteAsset(id) {
      await DataStore.deleteAsset(id);
      UI.setSaveStatus("資產已刪除");
      await this.refreshList();
    },
    async refreshList() {
      if (!dom.assetList || !dom.assetEmpty || !state.storageReady) return;
      try {
        const items = await DataStore.listAssets(this.ownerId());
        dom.assetList.innerHTML = "";
        dom.assetEmpty.hidden = items.length > 0;

        for (const item of items) {
          const card = document.createElement("div");
          card.className = "asset-item";

          const img = document.createElement("img");
          img.className = "asset-thumb";
          img.src = item.dataUrl;
          img.alt = item.name;

          const info = document.createElement("div");
          info.className = "asset-info";

          const name = document.createElement("div");
          name.className = "asset-name";
          name.textContent = item.name || "未命名資產";

          const meta = document.createElement("div");
          meta.className = "asset-meta";
          meta.textContent = `${item.type === "signature" ? "簽名" : "印章"} · ${formatTime(item.updatedAt)}`;

          const actions = document.createElement("div");
          actions.className = "asset-actions";

          const useBtn = document.createElement("button");
          useBtn.className = "btn small";
          useBtn.textContent = "套用";
          useBtn.addEventListener("click", async () => { await this.applyAsset(item.id); });

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "btn small danger";
          deleteBtn.textContent = "刪除";
          deleteBtn.addEventListener("click", async () => { await this.deleteAsset(item.id); });

          actions.appendChild(useBtn);
          actions.appendChild(deleteBtn);
          info.appendChild(name);
          info.appendChild(meta);
          info.appendChild(actions);

          card.appendChild(img);
          card.appendChild(info);
          dom.assetList.appendChild(card);
        }
      } catch (err) {
        console.error("Refresh assets failed:", err);
        dom.assetList.innerHTML = "";
        dom.assetEmpty.hidden = false;
        dom.assetEmpty.textContent = "資產列表讀取失敗。";
      }
    }
  };

  function pushCommand(cmd) {
    state.history.undo.push(cmd);
    state.history.redo.length = 0;
    UI.updateButtons();
    Docs.markDirty();
  }
  function undo() {
    const cmd = state.history.undo.pop();
    if (!cmd) return;
    cmd.undo();
    state.history.redo.push(cmd);
    UI.updateButtons();
    OverlayEngine.render();
    UI.syncInspector();
    Docs.markDirty();
  }
  function redo() {
    const cmd = state.history.redo.pop();
    if (!cmd) return;
    cmd.do();
    state.history.undo.push(cmd);
    UI.updateButtons();
    OverlayEngine.render();
    UI.syncInspector();
    Docs.markDirty();
  }

  const cmdAddAnno = (a) => ({
    do() {
      state.annotations.push(a);
      state.selectedId = a.id;
    },
    undo() {
      state.annotations = state.annotations.filter((x) => x.id !== a.id);
      if (state.selectedId === a.id) state.selectedId = null;
    }
  });
  const cmdRemoveAnno = (id, snap) => ({
    do() {
      state.annotations = state.annotations.filter((x) => x.id !== id);
      if (state.selectedId === id) state.selectedId = null;
    },
    undo() {
      state.annotations.push(clone(snap));
    }
  });
  const cmdUpdateAnno = (id, before, after) => ({
    do() {
      const target = getAnno(id);
      if (target) Object.assign(target, after);
    },
    undo() {
      const target = getAnno(id);
      if (target) Object.assign(target, before);
    }
  });

  const PDFEngine = {
    async loadFromFile(file) {
      const rawBytes = new Uint8Array(await file.arrayBuffer());
      await this.loadFromBytes(rawBytes, {
        docId: uid(),
        name: safeDocName(file.name),
        annotations: [],
        pageIndex: 0,
        autoFit: true,
        saveStatus: "文件已載入"
      });
      await Docs.saveCurrent({ silent: false });
    },
    calcFitZoom(baseWidthPx) {
      const host = dom.centerpanel;
      if (!host || !Number.isFinite(baseWidthPx) || baseWidthPx <= 0) return 1;
      // 預留左右 padding / 邊框，讓畫布在 centerpanel 內穩定置中
      const availableWidth = Math.max(280, host.clientWidth - 40);
      return clamp(availableWidth / baseWidthPx, 0.5, 2.5);
    },
    async loadFromStoredDoc(doc) {
      const rawBytes = bytesFromStorage(doc?.pdfBytes);
      if (!rawBytes) {
        throw new Error("草稿中的 PDF 內容不存在或格式錯誤");
      }
      await this.loadFromBytes(rawBytes, {
        docId: doc.id,
        name: safeDocName(doc.name),
        annotations: clone(doc.annotations || []),
        pageIndex: Number.isFinite(doc.pageIndex) ? doc.pageIndex : 0,
        zoom: Number.isFinite(doc.zoom) ? doc.zoom : 1,
        saveStatus: "草稿已載入"
      });
    },
    async loadFromBytes(rawBytes, options = {}) {
      state.pdfBytes = rawBytes.slice();
      const bytesForViewer = rawBytes.slice();
      state.pdfDoc = await pdfjsLib.getDocument({ data: bytesForViewer }).promise;
      state.pageCount = state.pdfDoc.numPages;
      state.pageIndex = clamp(options.pageIndex ?? 0, 0, Math.max(0, state.pageCount - 1));
      state.zoom = clamp(options.zoom ?? 1.0, 0.5, 2.5);
      state.annotations = clone(options.annotations || []);
      state.selectedId = null;
      state.history.undo.length = 0;
      state.history.redo.length = 0;
      state.currentDocId = options.docId || uid();
      state.docName = safeDocName(options.name || "未命名文件");
      state.isDirty = false;
      if (dom.docNameInput) dom.docNameInput.value = state.docName;

      state.pagesMeta = [];
      for (let i = 1; i <= state.pageCount; i++) {
        const page = await state.pdfDoc.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        state.pagesMeta.push({
          baseWidthPx: vp.width,
          baseHeightPx: vp.height,
          pdfWidthPt: null,
          pdfHeightPt: null
        });
      }

      if (options.autoFit && state.pagesMeta[0]) {
        state.zoom = this.calcFitZoom(state.pagesMeta[0].baseWidthPx);
      }

      await this.renderCurrentPage();
      UI.updateLabels();
      UI.updateButtons();
      UI.setSaveStatus(options.saveStatus || "文件已載入");
      await Docs.refreshList();
    },
    async renderCurrentPage() {
      if (!state.pdfDoc) return;
      const page = await state.pdfDoc.getPage(state.pageIndex + 1);
      const viewport = page.getViewport({ scale: state.zoom });

      const canvas = dom.pdfCanvas;
      const ctx = canvas.getContext("2d", { alpha: false });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      dom.stage.style.width = canvas.width + "px";
      dom.stage.style.height = canvas.height + "px";
      dom.overlay.style.width = canvas.width + "px";
      dom.overlay.style.height = canvas.height + "px";
      dom.guides.style.width = canvas.width + "px";
      dom.guides.style.height = canvas.height + "px";

      await page.render({ canvasContext: ctx, viewport }).promise;
      OverlayEngine.render();
      UI.updateLabels();
      UI.syncInspector();
      this.centerStageViewport();
    },
    resetWorkspace(reasonText = "尚未載入") {
      state.pdfDoc = null;
      state.pdfBytes = null;
      state.pageCount = 0;
      state.pageIndex = 0;
      state.zoom = 1.0;
      state.pagesMeta = [];
      state.annotations = [];
      state.selectedId = null;
      state.history.undo.length = 0;
      state.history.redo.length = 0;
      state.currentDocId = null;
      state.docName = "";
      state.isDirty = false;

      if (dom.docNameInput) dom.docNameInput.value = "";
      if (dom.pdfCanvas) {
        dom.pdfCanvas.width = 1;
        dom.pdfCanvas.height = 1;
      }
      if (dom.stage) {
        dom.stage.style.width = "100%";
        dom.stage.style.maxWidth = "100%";
        dom.stage.style.height = "calc(100vh - 120px)";
      }
      if (dom.overlay) dom.overlay.innerHTML = "";
      if (dom.guides) dom.guides.innerHTML = "";

      UI.updateLabels();
      UI.updateButtons();
      UI.syncInspector();
      UI.setSaveStatus(reasonText);
    },
    centerStageViewport() {
      // 讓 PDF 顯示區在 centerpanel 內水平置中，避免寬頁面出現偏移
      requestAnimationFrame(() => {
        const host = dom.centerpanel;
        if (!host || !dom.stage || dom.stage.hidden) return;
        const maxLeft = Math.max(0, host.scrollWidth - host.clientWidth);
        host.scrollLeft = maxLeft > 0 ? Math.round(maxLeft / 2) : 0;
      });
    }
  };

  const OverlayEngine = {
    render() {
      dom.overlay.innerHTML = "";
      dom.guides.innerHTML = "";
      if (!state.pdfDoc) return;

      const list = state.annotations
        .filter((a) => a.pageIndex === state.pageIndex)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      for (const a of list) {
        const el = this.createElement(a);
        dom.overlay.appendChild(el);
        if (a.id === state.selectedId) {
          el.classList.add("selected");
          this.addHandles(el, a);
        }
      }
    },
    createElement(a) {
      const el = document.createElement("div");
      el.className = "anno";
      el.dataset.id = a.id;

      let content;
      if (a.type === "text") {
        content = document.createElement("div");
        content.textContent = a.text || "";
        content.style.whiteSpace = "pre-wrap";
        content.style.color = normalizeHexColor(a.color, "#111111");
        content.style.fontSize = `${(a.fontSize || 18) * state.zoom}px`;
        content.style.padding = "2px 4px";
        content.style.borderRadius = "6px";
        content.style.background = "rgba(255,255,255,0)";
        content.style.width = "100%";
        content.style.height = "100%";
      } else if (a.type === "rect") {
        content = document.createElement("div");
        content.style.width = "100%";
        content.style.height = "100%";
        content.style.display = "block";
        content.style.pointerEvents = "none";
        content.style.background = "transparent";
        content.style.borderStyle = "solid";
        content.style.boxSizing = "border-box";
        content.style.borderColor = normalizeHexColor(a.color, "#d10000");
        content.style.borderWidth = `${Math.max(1, a.strokeWidth || 4) * state.zoom}px`;
      } else {
        content = document.createElement("img");
        content.src = a.dataUrl;
        content.draggable = false;
        content.style.width = "100%";
        content.style.height = "100%";
        content.style.display = "block";
        content.style.pointerEvents = "none";
      }

      el.appendChild(content);
      el.style.left = (a.x * state.zoom) + "px";
      el.style.top = (a.y * state.zoom) + "px";
      el.style.width = (a.w * state.zoom) + "px";
      el.style.height = (a.h * state.zoom) + "px";
      el.style.opacity = (a.opacity ?? 1);
      el.style.transform = `rotate(${a.rotation || 0}deg)`;

      el.addEventListener("pointerdown", (ev) => Interaction.onAnnoDown(ev, a.id));
      el.addEventListener("dblclick", () => {
        if (a.type === "text") Interaction.editText(a.id);
      });
      return el;
    },
    addHandles(el, a) {
      const handles = [
        ["nw", 0, 0], ["n", 50, 0], ["ne", 100, 0],
        ["e", 100, 50], ["se", 100, 100], ["s", 50, 100],
        ["sw", 0, 100], ["w", 0, 50],
      ];
      for (const [name, px, py] of handles) {
        const h = document.createElement("div");
        h.className = "handle";
        h.dataset.handle = name;
        h.style.left = `calc(${px}% - 6px)`;
        h.style.top = `calc(${py}% - 6px)`;
        h.addEventListener("pointerdown", (ev) => Interaction.onHandleDown(ev, a.id, name));
        el.appendChild(h);
      }
      const r = document.createElement("div");
      r.className = "handle rotate";
      r.dataset.handle = "rotate";
      r.style.left = "calc(50% - 7px)";
      r.style.top = "-22px";
      r.addEventListener("pointerdown", (ev) => Interaction.onRotateDown(ev, a.id));
      el.appendChild(r);
    }
  };

  const Snap = {
    threshold: 8,
    clear() { dom.guides.innerHTML = ""; },
    v(x) {
      const g = document.createElement("div");
      g.className = "guide v";
      g.style.left = `${x}px`;
      g.style.top = "0px";
      g.style.height = "100%";
      dom.guides.appendChild(g);
    },
    h(y) {
      const g = document.createElement("div");
      g.className = "guide h";
      g.style.top = `${y}px`;
      g.style.left = "0px";
      g.style.width = "100%";
      dom.guides.appendChild(g);
    },
    apply(rect, stageW, stageH) {
      this.clear();
      let { x, y, w, h } = rect;
      const cx = x + w / 2;
      const cy = y + h / 2;

      const candidatesV = [0, stageW / 2, stageW];
      const candidatesH = [0, stageH / 2, stageH];
      const xs = [x, x + w, cx];
      const ys = [y, y + h, cy];

      let snapDx = 0;
      let snapDy = 0;
      let bestDx = this.threshold + 1;
      let bestDy = this.threshold + 1;
      let guideX = null;
      let guideY = null;

      for (const xv of xs) {
        for (const c of candidatesV) {
          const d = c - xv;
          const ad = Math.abs(d);
          if (ad <= this.threshold && ad < bestDx) {
            bestDx = ad;
            snapDx = d;
            guideX = c;
          }
        }
      }
      for (const yv of ys) {
        for (const c of candidatesH) {
          const d = c - yv;
          const ad = Math.abs(d);
          if (ad <= this.threshold && ad < bestDy) {
            bestDy = ad;
            snapDy = d;
            guideY = c;
          }
        }
      }
      if (guideX !== null) this.v(guideX);
      if (guideY !== null) this.h(guideY);
      x += snapDx;
      y += snapDy;
      return { x, y, w, h };
    }
  };

  const Interaction = {
    mode: null,
    activeId: null,
    handle: null,
    start: null,

    startPlace(id) {
      const a = getAnno(id);
      if (!a) return;
      this.mode = "place";
      this.activeId = id;
      this.handle = null;
      this.start = { before: snapshotAnno(a) };
      dom.stage.classList.add("placing");
      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();
    },
    stopPlace() {
      dom.stage.classList.remove("placing");
    },
    onAnnoDown(ev, id) {
      ev.preventDefault();
      ev.stopPropagation();
      if (this.mode === "place") return;
      const a = getAnno(id);
      if (!a) return;

      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();
      if (a.locked) return;

      this.mode = "drag";
      this.activeId = id;
      this.handle = null;
      this.start = {
        startX: ev.clientX,
        startY: ev.clientY,
        origX: a.x,
        origY: a.y,
        before: snapshotAnno(a),
      };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    },
    onHandleDown(ev, id, handle) {
      ev.preventDefault();
      ev.stopPropagation();
      const a = getAnno(id);
      if (!a || a.locked) return;

      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();

      this.mode = "resize";
      this.activeId = id;
      this.handle = handle;
      this.start = {
        startX: ev.clientX,
        startY: ev.clientY,
        origX: a.x,
        origY: a.y,
        origW: a.w,
        origH: a.h,
        before: snapshotAnno(a),
      };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    },
    onRotateDown(ev, id) {
      ev.preventDefault();
      ev.stopPropagation();
      const a = getAnno(id);
      if (!a || a.locked) return;

      state.selectedId = id;
      OverlayEngine.render();
      UI.syncInspector();

      this.mode = "rotate";
      this.activeId = id;
      this.handle = "rotate";

      const el = dom.overlay.querySelector(`.anno[data-id="${id}"]`);
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      this.start = {
        centerX: cx,
        centerY: cy,
        startAngle: Math.atan2(ev.clientY - cy, ev.clientX - cx),
        origRotation: a.rotation || 0,
        before: snapshotAnno(a),
      };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    },
    onMove(ev) {
      if (!this.mode || !this.start) return;
      const a = getAnno(this.activeId);
      if (!a) return;

      const stageW = dom.pdfCanvas.width;
      const stageH = dom.pdfCanvas.height;

      if (this.mode === "place") {
        const rect = dom.stage.getBoundingClientRect();
        const inside = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        if (!inside) return;

        const xV = ev.clientX - rect.left - (a.w * state.zoom) / 2;
        const yV = ev.clientY - rect.top - (a.h * state.zoom) / 2;
        a.x = clamp(xV, 0, Math.max(0, stageW - a.w * state.zoom)) / state.zoom;
        a.y = clamp(yV, 0, Math.max(0, stageH - a.h * state.zoom)) / state.zoom;
        OverlayEngine.render();
        UI.syncInspector();
        return;
      }

      if (this.mode === "drag") {
        const dxV = ev.clientX - this.start.startX;
        const dyV = ev.clientY - this.start.startY;
        let xV = this.start.origX * state.zoom + dxV;
        let yV = this.start.origY * state.zoom + dyV;

        const snapped = Snap.apply({ x: xV, y: yV, w: a.w * state.zoom, h: a.h * state.zoom }, stageW, stageH);
        xV = snapped.x;
        yV = snapped.y;
        a.x = xV / state.zoom;
        a.y = yV / state.zoom;
        OverlayEngine.render();
        UI.syncInspector();
        return;
      }

      Snap.clear();

      if (this.mode === "resize") {
        const dx = (ev.clientX - this.start.startX) / state.zoom;
        const dy = (ev.clientY - this.start.startY) / state.zoom;
        let x = this.start.origX;
        let y = this.start.origY;
        let w = this.start.origW;
        let h = this.start.origH;
        const minSize = 12;
        const hnd = this.handle;

        const left = (hnd === "nw" || hnd === "w" || hnd === "sw");
        const right = (hnd === "ne" || hnd === "e" || hnd === "se");
        const top = (hnd === "nw" || hnd === "n" || hnd === "ne");
        const bottom = (hnd === "sw" || hnd === "s" || hnd === "se");

        if (right) w = clamp(this.start.origW + dx, minSize, 99999);
        if (bottom) h = clamp(this.start.origH + dy, minSize, 99999);
        if (left) {
          const newW = clamp(this.start.origW - dx, minSize, 99999);
          x = this.start.origX + (this.start.origW - newW);
          w = newW;
        }
        if (top) {
          const newH = clamp(this.start.origH - dy, minSize, 99999);
          y = this.start.origY + (this.start.origH - newH);
          h = newH;
        }

        a.x = x;
        a.y = y;
        a.w = w;
        a.h = h;
        OverlayEngine.render();
        UI.syncInspector();
        return;
      }

      if (this.mode === "rotate") {
        const ang = Math.atan2(ev.clientY - this.start.centerY, ev.clientX - this.start.centerX);
        const delta = ang - this.start.startAngle;
        const deg = delta * 180 / Math.PI;
        a.rotation = normalizeDeg(this.start.origRotation + deg);
        OverlayEngine.render();
        UI.syncInspector();
      }
    },
    onUp(ev) {
      if (!this.mode || !this.start) return;
      const a = getAnno(this.activeId);

      if (this.mode === "place" && ev && typeof ev.clientX === "number" && typeof ev.clientY === "number") {
        const rect = dom.stage.getBoundingClientRect();
        const inside = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        if (!inside) return;
      }

      if (a) {
        const after = snapshotAnno(a);
        if (JSON.stringify(this.start.before) !== JSON.stringify(after)) {
          pushCommand(cmdUpdateAnno(a.id, this.start.before, after));
        }
      }
      if (this.mode === "place") this.stopPlace();
      this.mode = null;
      this.activeId = null;
      this.handle = null;
      this.start = null;
      Snap.clear();
    },
    editText(id) {
      const a = getAnno(id);
      if (!a || a.type !== "text" || a.locked) return;
      const before = snapshotAnno(a);
      const t = prompt("編輯文字內容：", a.text || "");
      if (t === null) return;
      a.text = t;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
      UI.syncInspector();
    }
  };

  const SignaturePad = {
    ctx: null,
    drawing: false,
    last: null,
    init() {
      const c = dom.signCanvas;
      this.ctx = c.getContext("2d");
      this.ctx.lineWidth = 6;
      this.ctx.lineCap = "round";
      this.ctx.strokeStyle = "#111";

      c.addEventListener("pointerdown", (ev) => {
        this.drawing = true;
        this.last = this.pos(ev);
        c.setPointerCapture(ev.pointerId);
      });
      c.addEventListener("pointermove", (ev) => {
        if (!this.drawing) return;
        const p = this.pos(ev);
        this.ctx.beginPath();
        this.ctx.moveTo(this.last.x, this.last.y);
        this.ctx.lineTo(p.x, p.y);
        this.ctx.stroke();
        this.last = p;
      });
      c.addEventListener("pointerup",     () => { this.drawing = false; });
      c.addEventListener("pointercancel", () => { this.drawing = false; });
    },
    pos(ev) {
      const r = dom.signCanvas.getBoundingClientRect();
      // 修正：將瀏覽器顯示座標縮放至畫布邏輯座標（解決 HiDPI / 縮放後繪線偏移）
      const scaleX = dom.signCanvas.width / r.width;
      const scaleY = dom.signCanvas.height / r.height;
      return {
        x: (ev.clientX - r.left) * scaleX,
        y: (ev.clientY - r.top) * scaleY,
      };
    },
    clear() {
      this.ctx.clearRect(0, 0, dom.signCanvas.width, dom.signCanvas.height);
    },
    isBlank() {
      const pixels = this.ctx.getImageData(0, 0, dom.signCanvas.width, dom.signCanvas.height).data;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] !== 0) return false;
      }
      return true;
    },
    open() { dom.signDialog.showModal(); },
    close() { dom.signDialog.close(); },
    getPngDataUrl() { return dom.signCanvas.toDataURL("image/png"); }
  };

  async function fileToDataUrl(file) {
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }
  async function svgDataUrlToPngDataUrl(svgDataUrl, size = 768) {
    const img = new Image();
    img.src = svgDataUrl;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return c.toDataURL("image/png");
  }
  async function builtinStampDataUrl() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <defs>
          <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.15"/>
          </filter>
        </defs>
        <g filter="url(#s)">
          <circle cx="256" cy="256" r="218" fill="none" stroke="#d10000" stroke-width="18"/>
          <circle cx="256" cy="256" r="190" fill="none" stroke="#d10000" stroke-width="6" opacity="0.8"/>
          <text x="256" y="235" text-anchor="middle" font-size="56" fill="#d10000" font-family="sans-serif" font-weight="700">APPROVED</text>
          <text x="256" y="305" text-anchor="middle" font-size="34" fill="#d10000" font-family="sans-serif">eSIGN</text>
          <text x="256" y="355" text-anchor="middle" font-size="20" fill="#d10000" font-family="sans-serif" opacity="0.9">Digitools Studio</text>
        </g>
      </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);
    ctx.drawImage(img, 0, 0, 512, 512);
    URL.revokeObjectURL(url);
    return c.toDataURL("image/png");
  }
  async function imageSizeFromDataUrl(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    return {
      width: Math.max(1, img.naturalWidth || img.width || 1),
      height: Math.max(1, img.naturalHeight || img.height || 1),
    };
  }
  function calcInitialRect(srcW, srcH) {
    const stageW = Math.max(1, dom.pdfCanvas.width || 1);
    const stageH = Math.max(1, dom.pdfCanvas.height || 1);
    const maxW = Math.max(80, stageW * 0.38);
    const maxH = Math.max(80, stageH * 0.38);
    const scale = Math.min(maxW / srcW, maxH / srcH, 1);
    const w = clamp(Math.round(srcW * scale / state.zoom), 24, 2000);
    const h = clamp(Math.round(srcH * scale / state.zoom), 24, 2000);
    const x = clamp(Math.round((stageW / state.zoom - w) / 2), 0, 99999);
    const y = clamp(Math.round((stageH / state.zoom - h) / 2), 0, 99999);
    return { x, y, w, h };
  }
  async function addImageAnno(type, dataUrl, fallbackW = 240, fallbackH = 240, autoPlace = true) {
    let rect;
    try {
      const imgSize = await imageSizeFromDataUrl(dataUrl);
      rect = calcInitialRect(imgSize.width, imgSize.height);
    } catch {
      rect = calcInitialRect(fallbackW, fallbackH);
    }

    const a = {
      id: uid(),
      type,
      pageIndex: state.pageIndex,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: Date.now(),
      dataUrl,
    };
    const cmd = cmdAddAnno(a);
    cmd.do();
    pushCommand(cmd);
    OverlayEngine.render();
    UI.syncInspector();
    if (autoPlace) Interaction.startPlace(a.id);
  }
  function addTextAnno(text = "簽名：", w = 220, h = 44) {
    const rect = calcInitialRect(w, h);
    const a = {
      id: uid(),
      type: "text",
      pageIndex: state.pageIndex,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: Date.now(),
      text,
      fontSize: 18,
      color: "#111111",
    };
    const cmd = cmdAddAnno(a);
    cmd.do();
    pushCommand(cmd);
    OverlayEngine.render();
    UI.syncInspector();
    Interaction.startPlace(a.id);
  }
  function addRectAnno(w = 260, h = 140) {
    const rect = calcInitialRect(w, h);
    const a = {
      id: uid(),
      type: "rect",
      pageIndex: state.pageIndex,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: Date.now(),
      color: "#d10000",
      strokeWidth: 4,
    };
    const cmd = cmdAddAnno(a);
    cmd.do();
    pushCommand(cmd);
    OverlayEngine.render();
    UI.syncInspector();
    Interaction.startPlace(a.id);
  }

  const Exporter = {
    async exportPdf() {
      if (!state.pdfBytes) return;
      if (!window.PDFLib) throw new Error("pdf-lib 未載入，請確認網路可連線到 CDN。");
      const { PDFDocument, StandardFonts, rgb } = PDFLib;
      if (!hasPdfHeader(state.pdfBytes)) {
        throw new Error("上傳的 PDF 二進位資料無效，請重新上傳 PDF 後再匯出。");
      }
      const pdfDoc = await PDFDocument.load(state.pdfBytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < state.pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const meta = pageMeta(i);
        meta.pdfWidthPt = page.getWidth();
        meta.pdfHeightPt = page.getHeight();
      }

      for (let i = 0; i < state.pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const meta = pageMeta(i);
        const scaleX = meta.pdfWidthPt / meta.baseWidthPx;
        const scaleY = meta.pdfHeightPt / meta.baseHeightPx;
        const annos = state.annotations
          .filter((a) => a.pageIndex === i)
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        for (const a of annos) {
          const x = a.x * scaleX;
          const y = meta.pdfHeightPt - (a.y + a.h) * scaleY;
          const w = a.w * scaleX;
          const h = a.h * scaleY;

          if (a.type === "text") {
            if ((a.rotation || 0) !== 0) {
              const png = await rasterizeToPng(a);
              const img = await pdfDoc.embedPng(dataUrlToBytes(png));
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            } else {
              const c = hexToRgb01(a.color || "#111111");
              try {
                page.drawText(a.text || "", {
                  x,
                  y: y + Math.max(0, h - (a.fontSize * scaleY)),
                  size: (a.fontSize || 18) * scaleY,
                  font,
                  color: rgb(c.r, c.g, c.b),
                  opacity: a.opacity ?? 1,
                });
              } catch (err) {
                const message = err?.message || String(err);
                if (/WinAnsi cannot encode/i.test(message)) {
                  const png = await rasterizeToPng(a);
                  const img = await pdfDoc.embedPng(dataUrlToBytes(png));
                  page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
                } else {
                  throw err;
                }
              }
            }
          } else if (a.type === "rect") {
            if ((a.rotation || 0) !== 0) {
              const png = await rasterizeToPng(a);
              const img = await pdfDoc.embedPng(dataUrlToBytes(png));
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            } else {
              const c = hexToRgb01(a.color || "#d10000");
              const sw = Math.max(1, (a.strokeWidth || 4) * ((scaleX + scaleY) / 2));
              page.drawRectangle({
                x,
                y,
                width: w,
                height: h,
                borderColor: rgb(c.r, c.g, c.b),
                borderWidth: sw,
                opacity: a.opacity ?? 1,
              });
            }
          } else {
            if ((a.rotation || 0) !== 0) {
              const png = await rasterizeToPng(a);
              const img = await pdfDoc.embedPng(dataUrlToBytes(png));
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            } else {
              const img = await embedImageForPdf(pdfDoc, a.dataUrl);
              page.drawImage(img, { x, y, width: w, height: h, opacity: a.opacity ?? 1 });
            }
          }
        }
      }

      const out = await pdfDoc.save({ useObjectStreams: false });
      downloadBytes(out, suggestName());
    }
  };

  function suggestName() {
    const base = safeDocName(dom.docNameInput?.value || dom.fileInput.files?.[0]?.name || state.docName || "signed");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return `${base}-signed-${ts}.pdf`;
  }
  async function rasterizeToPng(a) {
    const dpr = Math.max(2, Math.floor(window.devicePixelRatio || 1));
    const cw = Math.max(1, Math.round(a.w * dpr));
    const ch = Math.max(1, Math.round(a.h * dpr));
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(((a.rotation || 0) * Math.PI) / 180);
    ctx.globalAlpha = a.opacity ?? 1;

    if (a.type === "text") {
      const fs = (a.fontSize || 18) * dpr;
      ctx.font = `${fs}px sans-serif`;
      ctx.fillStyle = normalizeHexColor(a.color, "#111111");
      ctx.textBaseline = "top";
      ctx.fillText(a.text || "", -cw / 2 + 4 * dpr, -ch / 2 + 4 * dpr);
    } else if (a.type === "rect") {
      ctx.strokeStyle = normalizeHexColor(a.color, "#d10000");
      ctx.lineWidth = Math.max(1, a.strokeWidth || 4) * dpr;
      const half = ctx.lineWidth / 2;
      ctx.strokeRect(-cw / 2 + half, -ch / 2 + half, Math.max(1, cw - ctx.lineWidth), Math.max(1, ch - ctx.lineWidth));
    } else {
      const img = new Image();
      img.src = a.dataUrl;
      await img.decode();
      ctx.drawImage(img, -cw / 2, -ch / 2, cw, ch);
    }
    ctx.restore();
    return c.toDataURL("image/png");
  }
  function dataUrlToBytes(dataUrl) {
    const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!m) throw new Error("Invalid dataUrl");
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function hasPdfHeader(bytes) {
    if (!bytes || !bytes.length) return false;
    const limit = Math.min(bytes.length - 4, 2048);
    for (let i = 0; i <= limit; i++) {
      if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46 && bytes[i + 4] === 0x2d) {
        return true;
      }
    }
    return false;
  }
  async function embedImageForPdf(pdfDoc, dataUrl) {
    const m = dataUrl.match(/^data:(.+);base64,/);
    if (!m) throw new Error("Invalid image dataUrl");
    const mime = (m[1] || "").toLowerCase();
    const bytes = dataUrlToBytes(dataUrl);
    if (mime === "image/png") return pdfDoc.embedPng(bytes);
    if (mime === "image/jpeg" || mime === "image/jpg") return pdfDoc.embedJpg(bytes);
    const png = await forceDataUrlToPng(dataUrl);
    return pdfDoc.embedPng(dataUrlToBytes(png));
  }
  async function forceDataUrlToPng(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = Math.max(1, img.naturalWidth || img.width || 1);
    c.height = Math.max(1, img.naturalHeight || img.height || 1);
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  }
  function downloadBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
  }

  const Auth = {
    init() {
      // 註冊全域 callback，讓 index.html 的 handleGoogleLogin / logoutGoogleUser 能通知 app.js
      window._signflowOnLogin = (user) => {
        state.auth.user = user;
        state.auth.busy = false;
        // 使用 index.html 的 renderAuthState(true) 觸發帶動畫的頁面切換
        if (typeof window.renderAuthState === "function") window.renderAuthState(true);
        Docs.refreshList().catch(() => {});
      };
      window._signflowOnLogout = () => {
        state.auth.user = null;
        state.auth.busy = false;
        if (typeof window.renderAuthState === "function") window.renderAuthState(true);
        Docs.refreshList().catch(() => {});
      };

      // 從 localStorage 恢復登入狀態
      const raw = localStorage.getItem(window._GOOGLE_STORAGE_KEY || "google_user");
      if (raw) {
        try { state.auth.user = JSON.parse(raw); } catch (e) { localStorage.removeItem("google_user"); }
      }
      // 頁面載入：無動畫，直接同步 UI
      if (typeof window.renderAuthState === "function") window.renderAuthState(false);
      if (state.auth.user) {
        Docs.refreshList().catch(() => {});
      }
    },
    signIn() {
      if (state.auth.busy) return;
      if (typeof window.triggerGoogleLogin === "function") {
        window.triggerGoogleLogin();
      } else if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
      } else {
        alert("Google 登入 SDK 尚未載入，請稍候再試或重新整理頁面。");
      }
    },
    signOut() {
      if (typeof window.logoutGoogleUser === "function") {
        window.logoutGoogleUser();
      }
    }
  };

  const UI = {
    bind() {
      dom.fileInput.addEventListener("change", async () => {
        const f = dom.fileInput.files?.[0];
        if (!f) return;
        dom.fileInput.disabled = true;
        UI.setSaveStatus("PDF 載入中，請稍候...");
        try {
          await PDFEngine.loadFromFile(f);
        } catch (err) {
          UI.setSaveStatus("PDF 載入失敗");
          alert(`PDF 載入失敗：${err?.message || String(err)}`);
          console.error("PDF load error:", err);
        } finally {
          dom.fileInput.disabled = false;
          dom.fileInput.value = ""; // 允許再次上傳相同檔名
        }
      });
      dom.btnPrev.addEventListener("click", async () => {
        await this.goToPage(state.pageIndex - 1);
      });
      dom.btnNext.addEventListener("click", async () => {
        await this.goToPage(state.pageIndex + 1);
      });
      dom.pageLabel?.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        const input = prompt(`目前頁碼 ${state.pageIndex + 1}/${state.pageCount}，請輸入要前往的頁碼：`, String(state.pageIndex + 1));
        if (input === null) return;
        const target = parseInt(String(input).trim(), 10);
        if (!Number.isFinite(target)) return;
        await this.goToPage(target - 1);
      });
      dom.btnZoomIn.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        state.zoom = clamp(state.zoom + 0.1, 0.5, 2.5);
        await PDFEngine.renderCurrentPage();
        Docs.markDirty();
      });
      dom.btnZoomOut.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        state.zoom = clamp(state.zoom - 0.1, 0.5, 2.5);
        await PDFEngine.renderCurrentPage();
        Docs.markDirty();
      });
      dom.stampInput?.addEventListener("change", async () => {
        if (!state.pdfDoc) {
          dom.stampInput.value = "";
          return;
        }
        const f = dom.stampInput.files?.[0];
        if (!f) return;
        const dataUrl = await fileToDataUrl(f);
        let png = dataUrl;
        if (f.type === "image/svg+xml") png = await svgDataUrlToPngDataUrl(dataUrl, 768);
        // 不走 local storage，只做當前文件蓋章
        await addImageAnno("stamp", png, 240, 240, false);
        dom.stampInput.value = "";
      });
      dom.btnAddSign.addEventListener("click", () => {
        if (!state.pdfDoc) return;
        SignaturePad.open();
      });
      dom.btnAddText.addEventListener("click", () => {
        if (!state.pdfDoc) return;
        const t = prompt("請輸入文字內容：", "");
        if (t === null) return;
        addTextAnno((t || "文字").trim() || "文字");
      });
      dom.btnAddRect.addEventListener("click", () => {
        if (!state.pdfDoc) return;
        addRectAnno();
      });
      dom.btnUndo.addEventListener("click", () => undo());
      dom.btnRedo.addEventListener("click", () => redo());
      dom.btnExport.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        dom.btnExport.disabled = true;
        try {
          await Docs.saveCurrent({ silent: true });
          await Exporter.exportPdf();
          UI.setSaveStatus("已匯出 PDF");
        } catch (err) {
          const msg = err?.message || String(err);
          alert(`匯出 PDF 失敗：${msg}`);
          console.error("Export PDF failed:", err);
        } finally {
          dom.btnExport.disabled = false;
        }
      });
      dom.btnSignClose.addEventListener("click", () => SignaturePad.close());
      dom.btnSignClear.addEventListener("click", () => SignaturePad.clear());
      dom.btnSignUse.addEventListener("click", async () => {
        if (!state.pdfDoc) return;
        // 套用後先完成放置，避免維持 place mode 造成後續文字輸入/互動卡住
        await addImageAnno("signature", SignaturePad.getPngDataUrl(), 320, 140, false);
        SignaturePad.close();
      });
      dom.opacityRange.addEventListener("input", () => this.applyOpacity());
      dom.rotateRange.addEventListener("input", () => this.applyRotate());
      dom.colorInput.addEventListener("input", () => this.applyColor());
      dom.thicknessRange.addEventListener("input", () => this.applyThickness());
      dom.btnDelete.addEventListener("click", () => this.deleteSelected());
      dom.btnLock.addEventListener("click", () => this.toggleLock());
      dom.btnBringFront.addEventListener("click", () => this.bringFront());
      dom.btnSendBack.addEventListener("click", () => this.sendBack());
      dom.btnLoginGoogle?.addEventListener("click", () => Auth.signIn());
      dom.btnLogout?.addEventListener("click", () => Auth.signOut());

      // Landing page buttons
      const _landingLogin = document.getElementById("landingBtnLogin");
      if (_landingLogin) _landingLogin.addEventListener("click", () => Auth.signIn());
      const _landingNavLogin = document.getElementById("landingNavLogin");
      if (_landingNavLogin) _landingNavLogin.addEventListener("click", () => Auth.signIn());

      // Consulting dialog
      const _btnConsult = document.getElementById("btnConsult");
      if (_btnConsult) _btnConsult.addEventListener("click", () => Consult.open());
      const _btnConsultClose = document.getElementById("btnConsultClose");
      if (_btnConsultClose) _btnConsultClose.addEventListener("click", () => Consult.close());
      const _btnConsultSubmit = document.getElementById("btnConsultSubmit");
      if (_btnConsultSubmit) _btnConsultSubmit.addEventListener("click", () => Consult.submit());
      const _btnConsultDone = document.getElementById("btnConsultDone");
      if (_btnConsultDone) _btnConsultDone.addEventListener("click", () => Consult.close());
      dom.btnSaveDraft?.addEventListener("click", async () => {
        await Docs.saveCurrent({ silent: false });
      });
      dom.docNameInput?.addEventListener("input", () => {
        state.docName = dom.docNameInput.value || "未命名文件";
        Docs.markDirty();
      });
    },
    async goToPage(nextIndex) {
      if (!state.pdfDoc) return;
      const clamped = clamp(nextIndex, 0, Math.max(0, state.pageCount - 1));
      if (clamped === state.pageIndex) {
        this.updateButtons();
        return;
      }
      state.pageIndex = clamped;
      state.selectedId = null;
      try {
        await PDFEngine.renderCurrentPage();
        Docs.markDirty();
      } finally {
        this.updateButtons();
      }
    },
    updateLabels() {
      dom.pageLabel.textContent = state.pdfDoc ? `${state.pageIndex + 1} / ${state.pageCount}` : "- / -";
      dom.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    },
    updateButtons() {
      const has = !!state.pdfDoc;
      // 翻頁 / 縮放
      dom.btnPrev.disabled    = !has || state.pageIndex === 0;
      dom.btnNext.disabled    = !has || state.pageIndex === state.pageCount - 1;
      dom.btnZoomIn.disabled  = !has;
      dom.btnZoomOut.disabled = !has;
      // 歷史
      dom.btnUndo.disabled = state.history.undo.length === 0;
      dom.btnRedo.disabled = state.history.redo.length === 0;
      // 工具列操作（無 PDF 時視覺 disabled）
      dom.btnAddSign.disabled         = !has;
      dom.btnAddText.disabled         = !has;
      dom.btnAddRect.disabled         = !has;
      if (dom.stampInput) dom.stampInput.disabled = !has;
      // 匯出 / 草稿
      dom.btnExport.disabled = !has;
      if (dom.btnSaveDraft) dom.btnSaveDraft.disabled  = !has;
      if (dom.docNameInput) dom.docNameInput.disabled  = !has;
    },
    syncInspector() {
      const a = getSelected();
      if (!a) {
        dom.opacityRange.value = "1";
        dom.opacityLabel.textContent = "1.00";
        dom.rotateRange.value = "0";
        dom.rotateLabel.textContent = "0°";
        dom.colorInput.value = "#111111";
        dom.colorLabel.textContent = "#111111";
        dom.thicknessRange.value = "4";
        dom.thicknessLabel.textContent = "4";
        dom.colorInput.disabled = true;
        dom.thicknessRange.disabled = true;
        return;
      }
      const op = a.opacity ?? 1;
      dom.opacityRange.value = String(op);
      dom.opacityLabel.textContent = op.toFixed(2);
      const rot = a.rotation ?? 0;
      dom.rotateRange.value = String(rot);
      dom.rotateLabel.textContent = `${Math.round(rot)}°`;
      const canColor = a.type === "text" || a.type === "rect";
      dom.colorInput.disabled = !canColor;
      dom.thicknessRange.disabled = a.type !== "rect";
      const color = normalizeHexColor(a.color, a.type === "rect" ? "#d10000" : "#111111");
      dom.colorInput.value = color;
      dom.colorLabel.textContent = color;
      const stroke = String(Math.max(1, Math.round(a.strokeWidth || 4)));
      dom.thicknessRange.value = stroke;
      dom.thicknessLabel.textContent = stroke;
    },
    setSaveStatus(text) {
      if (dom.saveStatus) dom.saveStatus.textContent = text;
    },
    updateAuthState() {
      // 所有 UI 狀態由 renderAuthState 統一管理，避免兩套邏輯衝突
      if (typeof window.renderAuthState === "function") window.renderAuthState(false);
    },
    applyOpacity() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.opacity = parseFloat(dom.opacityRange.value);
      dom.opacityLabel.textContent = (a.opacity ?? 1).toFixed(2);
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },
    applyRotate() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.rotation = parseFloat(dom.rotateRange.value);
      dom.rotateLabel.textContent = `${Math.round(a.rotation)}°`;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },
    applyColor() {
      const a = getSelected();
      if (!a || a.locked || (a.type !== "text" && a.type !== "rect")) return;
      const before = snapshotAnno(a);
      a.color = normalizeHexColor(dom.colorInput.value, a.type === "rect" ? "#d10000" : "#111111");
      dom.colorLabel.textContent = a.color;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },
    applyThickness() {
      const a = getSelected();
      if (!a || a.locked || a.type !== "rect") return;
      const before = snapshotAnno(a);
      a.strokeWidth = clamp(parseInt(dom.thicknessRange.value, 10) || 1, 1, 24);
      dom.thicknessLabel.textContent = String(a.strokeWidth);
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },
    deleteSelected() {
      const a = getSelected();
      if (!a || a.locked) return;
      const snap = snapshotAnno(a);
      const cmd = cmdRemoveAnno(a.id, snap);
      cmd.do();
      pushCommand(cmd);
      OverlayEngine.render();
      this.syncInspector();
    },
    toggleLock() {
      const a = getSelected();
      if (!a) return;
      const before = snapshotAnno(a);
      a.locked = !a.locked;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
      this.syncInspector();
    },
    bringFront() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.zIndex = Date.now();
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    },
    sendBack() {
      const a = getSelected();
      if (!a || a.locked) return;
      const before = snapshotAnno(a);
      a.zIndex = 0;
      pushCommand(cmdUpdateAnno(a.id, before, snapshotAnno(a)));
      OverlayEngine.render();
    }
  };

  window.addEventListener("pointermove", (ev) => Interaction.onMove(ev));
  window.addEventListener("pointerup", (ev) => Interaction.onUp(ev));

  // ── Consult (客製開發需求) ─────────────────────────────────────
  const Consult = {
    _dialog: null,
    init() {
      this._dialog = document.getElementById("consultDialog");
    },
    open() {
      if (!this._dialog) return;
      // Pre-fill name / email from Google auth
      const user = state.auth.user;
      const nameEl = document.getElementById("consultName");
      const emailEl = document.getElementById("consultEmail");
      if (user) {
        if (nameEl && !nameEl.value) nameEl.value = user.name || "";
        if (emailEl && !emailEl.value) emailEl.value = user.email || "";
      }
      // Reset to form view
      const formEl = document.getElementById("consultForm");
      const successEl = document.getElementById("consultSuccess");
      const errorEl = document.getElementById("consultError");
      if (formEl) formEl.hidden = false;
      if (successEl) successEl.hidden = true;
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ""; }
      this._dialog.showModal();
    },
    close() {
      if (this._dialog) this._dialog.close();
    },
    submit() {
      const name = (document.getElementById("consultName")?.value || "").trim();
      const email = (document.getElementById("consultEmail")?.value || "").trim();
      const company = (document.getElementById("consultCompany")?.value || "").trim();
      const message = (document.getElementById("consultMessage")?.value || "").trim();
      const errorEl = document.getElementById("consultError");

      // Validation
      if (!name || !email || !message) {
        if (errorEl) {
          errorEl.textContent = "請塡寫姓名、Email 與需求描述。";
          errorEl.hidden = false;
        }
        return;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        if (errorEl) {
          errorEl.textContent = "Email 格式不正確，請重新檢查。";
          errorEl.hidden = false;
        }
        return;
      }
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ""; }

      // Save lead to localStorage
      try {
        const leads = JSON.parse(localStorage.getItem("signflow-leads") || "[]");
        leads.push({ name, email, company, message, submittedAt: new Date().toISOString() });
        localStorage.setItem("signflow-leads", JSON.stringify(leads));
      } catch (e) {
        console.warn("Could not save lead to localStorage:", e);
      }

      // Show success state
      const formEl = document.getElementById("consultForm");
      const successEl = document.getElementById("consultSuccess");
      if (formEl) formEl.hidden = true;
      if (successEl) successEl.hidden = false;

      // Open mailto if inquiry email is configured
      const ownerEmail = (window.APP_CONFIG?.inquiryEmail || "").trim();
      if (ownerEmail) {
        const sub = encodeURIComponent("[SignFlow PDF] 客製需求洽詢");
        const body = encodeURIComponent(
          `姓名：${name}\nEmail：${email}\n公司：${company || "（未填寫）"}\n\n需求描述：\n${message}`
        );
        window.open(`mailto:${ownerEmail}?subject=${sub}&body=${body}`, "_blank");
      }
    }
  };
  // ── /Consult ──────────────────────────────────────────────────


  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && Interaction.mode === "place") {
      Interaction.stopPlace();
      Interaction.mode = null;
      Interaction.activeId = null;
      Interaction.handle = null;
      Interaction.start = null;
      return;
    }
    if (ev.key === "Delete" || ev.key === "Backspace") {
      UI.deleteSelected();
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
      ev.preventDefault();
      undo();
    }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === "y" || (ev.shiftKey && ev.key.toLowerCase() === "z"))) {
      ev.preventDefault();
      redo();
    }
  });
  dom.overlay.addEventListener("pointerdown", (ev) => {
    if (ev.target === dom.overlay) {
      state.selectedId = null;
      OverlayEngine.render();
      UI.syncInspector();
    }
  });

  SignaturePad.init();
  Consult.init();
  UI.bind();
  PDFEngine.resetWorkspace();
  Docs.init().catch((err) => console.error(err));
  Auth.init(); // 同步函式，內部已呼叫 renderAuthState(false) 完成初始化
})();
