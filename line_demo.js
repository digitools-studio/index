// LINE Bot Demo - Standalone JavaScript Module
(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLineDemo);
  } else {
    initLineDemo();
  }

  function initLineDemo() {
    console.log('[LINE-DEMO] Initializing...');

    // DOM Elements
    const chatEl = document.getElementById('lcChat');
    const quickEl = document.getElementById('lcQuickReplies');
    const tagBadgeEl = document.getElementById('lcTagBadge');
    const tagsEl = document.getElementById('lcTags');
    const resetBtn = document.getElementById('lcReset');
    const autoBtn = document.getElementById('lcAutoRun');

    // Verify elements exist
    if (!chatEl || !quickEl) {
      console.error('[LINE-DEMO] Required DOM elements not found!');
      return;
    }

    console.log('[LINE-DEMO] DOM elements found:', { chatEl: !!chatEl, quickEl: !!quickEl, resetBtn: !!resetBtn, autoBtn: !!autoBtn });

    // Configuration
    const BOOKING_URL = "YOUR_BOOKING_URL";
    const LINE_OA_URL = "https://lin.ee/6IdgZC4";

    // State
    const state = {
      step: "start",
      tags: new Set(),
      data: {
        goal: null,
        serviceType: null,
        timePref: null,
        budgetPlan: null
      }
    };

    // Utilities
    function lcTrack(eventName, params = {}) {
      console.log("[LINE-DEMO]", eventName, params);
    }

    function escapeHtml(s) {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };
      return (s || "").replace(/[&<>"']/g, m => map[m]);
    }

    function scrollToBottom() {
      if (chatEl) {
        chatEl.scrollTop = chatEl.scrollHeight;
      }
    }

    function addMsg({ who, text, meta }) {
      console.log("[LINE-DEMO] addMsg:", { who, text: text.substring(0, 40) });
      
      const isBot = who === "bot";
      const wrap = document.createElement("div");
      wrap.className = "flex " + (isBot ? "justify-start" : "justify-end");

      const bubble = document.createElement("div");
      bubble.className = (isBot
        ? "max-w-[85%] rounded-2xl rounded-tl-sm bg-white text-gray-900 border border-gray-200"
        : "max-w-[85%] rounded-2xl rounded-tr-sm bg-green-500 text-white"
      ) + " px-4 py-3 shadow-md";

      const textHtml = escapeHtml(text).replace(/\n/g, "<br>");
      const metaHtml = meta ? `<div class="mt-2 pt-2 border-t ${isBot ? "border-gray-200 text-gray-500" : "border-white/20 text-white/80"} text-[10px] flex items-center gap-1"><span>✓</span><span>${escapeHtml(meta)}</span></div>` : "";
      
      bubble.innerHTML = `<div class="text-sm leading-relaxed whitespace-pre-line">${textHtml}</div>${metaHtml}`;

      wrap.appendChild(bubble);
      chatEl.appendChild(wrap);
      scrollToBottom();
    }

    function setQuickReplies(replies) {
      console.log("[LINE-DEMO] setQuickReplies:", replies ? replies.map(r => r.label).join(", ") : "empty");
      
      quickEl.innerHTML = "";
      if (!replies || !replies.length) return;

      replies.forEach((r, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "px-4 py-2.5 rounded-lg bg-white border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 hover:shadow-md text-sm font-semibold text-gray-800 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 relative overflow-hidden group";
        
        // Add icon
        const icon = getIconForButton(r.label, r.id);
        if (icon) {
          const iconSpan = document.createElement("span");
          iconSpan.className = "text-base";
          iconSpan.textContent = icon;
          btn.appendChild(iconSpan);
        }
        
        // Add text
        const textSpan = document.createElement("span");
        textSpan.textContent = r.label;
        btn.appendChild(textSpan);
        
        btn.style.animationDelay = `${idx * 50}ms`;
        btn.classList.add("animate-fadeIn");
        
        btn.addEventListener("click", () => {
          console.log("[LINE-DEMO] Quick reply clicked:", r.id);
          lcTrack("line_demo_quick_reply_click", { label: r.label, id: r.id, step: state.step });
          handleUserChoice(r);
        });
        
        quickEl.appendChild(btn);
      });
    }

    function getIconForButton(label, id) {
      if (id.includes("book") || label.includes("預約")) return "📅";
      if (id.includes("consult") || label.includes("諮詢")) return "💭";
      if (id.includes("promo") || label.includes("優惠")) return "🎁";
      if (id.includes("service") || label.includes("服務")) return "✨";
      if (id.includes("nails") || label.includes("美甲")) return "💅";
      if (id.includes("lashes") || label.includes("睫毛")) return "👁️";
      if (id.includes("facial") || label.includes("保養")) return "🧖";
      if (id.includes("time") || label.includes("時段")) return "⏰";
      if (id.includes("weekday")) return "📆";
      if (id.includes("weekend")) return "🎉";
      if (id.includes("plan") || id.includes("budget")) return "💰";
      if (label.includes("款式") || label.includes("設計")) return "🎨";
      if (label.includes("價格")) return "💵";
      return "";
    }

    function updateTags() {
      if (!tagBadgeEl || !tagsEl) return;
      const tags = Array.from(state.tags);
      if (tags.length) {
        tagBadgeEl.classList.remove("hidden");
        tagsEl.textContent = tags.join("｜");
      } else {
        tagBadgeEl.classList.add("hidden");
        tagsEl.textContent = "—";
      }
    }

    function addTag(t) {
      state.tags.add(t);
      updateTags();
    }

    function resetDemo() {
      console.log("[LINE-DEMO] Demo reset");
      state.step = "start";
      state.tags = new Set();
      state.data = { goal: null, serviceType: null, timePref: null, budgetPlan: null };
      chatEl.innerHTML = "";
      updateTags();
      boot();
      lcTrack("line_demo_reset");
    }

    function boot() {
      console.log("[LINE-DEMO] Boot called");
      addMsg({
        who: "bot",
        text: `嗨～我是「美甲小幫手」(Demo) ✨
想要我幫你完成哪一件事？

💡 點選下方快速回覆按鈕開始互動`,
        meta: "📱 示意：LINE Rich Text + 客製化圖文選單分流"
      });

      setQuickReplies([
        { id: "goal_book", label: "我要預約" },
        { id: "goal_consult", label: "我想先諮詢" },
        { id: "goal_promo", label: "看折扣優惠" },
        { id: "goal_services", label: "看服務項目" }
      ]);

      state.step = "start";
    }

    function renderPromos() {
      console.log("[LINE-DEMO] renderPromos called");
      lcTrack("line_demo_view_promos");
      addMsg({
        who: "bot",
        text: `本月優惠（示意）：
1) 新客凝膠手部 9 折
2) 兩人同行享加購折扣
3) 套餐：手+足 省更多

你想直接「預約」還是「先諮詢」確認適合的方案？`,
        meta: "示意：可依來源/活動碼自動套用優惠"
      });
      setQuickReplies([
        { id: "go_booking", label: "直接預約" },
        { id: "go_consult", label: "先諮詢方案" }
      ]);
    }

    function renderServices() {
      console.log("[LINE-DEMO] renderServices called");
      lcTrack("line_demo_view_services");
      addMsg({
        who: "bot",
        text: `服務項目（示意）：
• 美甲/凝膠：單色、跳色、款式設計
• 睫毛：自然款、濃密款、補接
• 臉部保養：清粉刺、保濕、舒緩

想先看「優惠」或直接「預約」？`,
        meta: "示意：可依客戶標籤推薦對應服務"
      });
      setQuickReplies([
        { id: "svc_jump_booking", label: "直接預約" },
        { id: "svc_jump_consult", label: "先諮詢" },
        { id: "goal_promo", label: "看折扣優惠" }
      ]);
      state.step = "show_services";
    }

    function renderResult() {
      console.log("[LINE-DEMO] renderResult called");
      lcTrack("line_demo_result", {
        goal: state.data.goal || "",
        serviceType: state.data.serviceType || "",
        timePref: state.data.timePref || "",
        plan: state.data.budgetPlan || ""
      });

      const suggestion = `我幫你整理好了（示意）：
• 需求：${state.data.goal || "—"}｜${state.data.serviceType || "—"}
• 偏好：${state.data.timePref || "—"}｜方案：${state.data.budgetPlan || "—"}

下一步建議：
1) 點「開啟預約頁」選時間（最快）
2) 或點「打開 LINE」讓我收集款式/照片，並由人員接手確認`;

      addMsg({
        who: "bot",
        text: suggestion,
        meta: "示意：此步可自動建立 lead（寫入 Sheet/CRM）+ 發預約提醒"
      });

      setQuickReplies([
        { id: "open_booking", label: "開啟預約頁" },
        { id: "open_line", label: "打開 LINE 真人接手" },
        { id: "restart", label: "再跑一次 demo" }
      ]);

      state.step = "result";
    }

    function handleUserChoice(choice) {
      console.log("[LINE-DEMO] handleUserChoice:", { id: choice.id, label: choice.label, step: state.step });
      addMsg({ who: "user", text: choice.label });

      switch (state.step) {
        case "start":
          if (choice.id === "goal_book") {
            state.data.goal = "預約";
            addTag("目標：預約");
            state.step = "choose_service_for_booking";
            addMsg({ who: "bot", text: "好的～想預約哪一種服務呢？✨\n\n請選擇您感興趣的項目：", meta: "💡 動態選單：依使用者意圖產生" });
            setQuickReplies([
              { id: "svc_nails", label: "美甲/凝膠" },
              { id: "svc_lashes", label: "睫毛" },
              { id: "svc_facial", label: "臉部保養" }
            ]);
            return;
          }
          if (choice.id === "goal_consult") {
            state.data.goal = "諮詢";
            addTag("目標：諮詢");
            state.step = "choose_service_for_consult_2";
            addMsg({ who: "bot", text: "沒問題～你想先諮詢哪一塊？💭\n\n請選擇你感興趣的服務：", meta: "🎯 智能分流：3 步驟收集需求" });
            setQuickReplies([
              { id: "svc_nails2", label: "美甲/凝膠" },
              { id: "svc_lashes2", label: "睫毛" },
              { id: "svc_facial2", label: "臉部保養" }
            ]);
            return;
          }
          if (choice.id === "goal_promo") {
            state.data.goal = "優惠";
            addTag("目標：優惠");
            state.step = "show_promos";
            renderPromos();
            return;
          }
          if (choice.id === "goal_services") {
            state.data.goal = "服務";
            addTag("目標：服務");
            state.step = "show_services";
            renderServices();
            return;
          }
          break;

        case "choose_service_for_booking":
          state.data.serviceType = choice.id === "svc_nails" ? "美甲/凝膠" : choice.id === "svc_lashes" ? "睫毛" : "臉部保養";
          addTag("服務：" + state.data.serviceType);
          state.step = "choose_time";
          addMsg({ who: "bot", text: "了解～你偏好的時段是？⏰\n\n讓我幫你找到最合適的時間：", meta: "📅 時段篩選" });
          setQuickReplies([
            { id: "t_weekday_day", label: "平日白天" },
            { id: "t_weekday_night", label: "平日晚上" },
            { id: "t_weekend", label: "週末" }
          ]);
          return;

        case "choose_service_for_consult_2":
          state.data.serviceType = choice.id === "svc_nails2" ? "美甲/凝膠" : choice.id === "svc_lashes2" ? "睫毛" : "臉部保養";
          addTag("服務：" + state.data.serviceType);
          state.step = "choose_time_consult";
          addMsg({ who: "bot", text: "好的～最後一題：你希望什麼時段比較方便諮詢？⏰" });
          setQuickReplies([
            { id: "t_weekday_day2", label: "平日白天" },
            { id: "t_weekday_night2", label: "平日晚上" },
            { id: "t_weekend2", label: "週末" }
          ]);
          return;

        case "choose_time":
        case "choose_time_consult":
          state.data.timePref = choice.id.includes("weekday_day") ? "平日白天" : choice.id.includes("weekday_night") ? "平日晚上" : "週末";
          addTag("時段：" + state.data.timePref);
          const isConsult = state.step === "choose_time_consult";
          state.step = isConsult ? "choose_plan_consult" : "choose_plan";
          addMsg({ who: "bot", text: "好～你想看哪一種方案？（會影響折扣與建議款式）" });
          setQuickReplies([
            { id: "p_new", label: "新客優惠" },
            { id: "p_set", label: "套餐方案" },
            { id: "p_vip", label: "回購/會員" }
          ]);
          return;

        case "choose_plan":
        case "choose_plan_consult":
          state.data.budgetPlan = choice.id === "p_new" ? "新客優惠" : choice.id === "p_set" ? "套餐方案" : "回購/會員";
          addTag("方案：" + state.data.budgetPlan);
          state.step = "result";
          renderResult();
          return;

        case "show_promos":
          if (choice.id === "go_booking") {
            state.step = "choose_service_for_booking";
            addMsg({ who: "bot", text: "好～我們直接進預約流程。想預約哪一種服務？" });
            setQuickReplies([
              { id: "svc_nails", label: "美甲/凝膠" },
              { id: "svc_lashes", label: "睫毛" },
              { id: "svc_facial", label: "臉部保養" }
            ]);
            return;
          }
          if (choice.id === "go_consult") {
            state.step = "choose_service_for_consult_2";
            addMsg({ who: "bot", text: "沒問題～你想先諮詢哪一個服務？" });
            setQuickReplies([
              { id: "svc_nails2", label: "美甲/凝膠" },
              { id: "svc_lashes2", label: "睫毛" },
              { id: "svc_facial2", label: "臉部保養" }
            ]);
            return;
          }
          break;

        case "show_services":
          if (choice.id === "svc_jump_booking") {
            state.step = "choose_service_for_booking";
            addMsg({ who: "bot", text: "好的～想預約哪一種服務呢？" });
            setQuickReplies([
              { id: "svc_nails", label: "美甲/凝膠" },
              { id: "svc_lashes", label: "睫毛" },
              { id: "svc_facial", label: "臉部保養" }
            ]);
            return;
          }
          if (choice.id === "svc_jump_consult") {
            state.step = "choose_service_for_consult_2";
            addMsg({ who: "bot", text: "沒問題～你想先諮詢哪一個服務？" });
            setQuickReplies([
              { id: "svc_nails2", label: "美甲/凝膠" },
              { id: "svc_lashes2", label: "睫毛" },
              { id: "svc_facial2", label: "臉部保養" }
            ]);
            return;
          }
          if (choice.id === "goal_promo") {
            state.step = "show_promos";
            renderPromos();
            return;
          }
          break;

        case "result":
          if (choice.id === "restart") {
            resetDemo();
            return;
          }
          if (choice.id === "open_line") {
            lcTrack("line_demo_open_line_click");
            window.open(LINE_OA_URL, "_blank");
            return;
          }
          if (choice.id === "open_booking") {
            lcTrack("line_demo_open_booking_click");
            if (BOOKING_URL && BOOKING_URL !== "YOUR_BOOKING_URL") {
              window.open(BOOKING_URL, "_blank");
            } else {
              addMsg({ who: "bot", text: "提示：你尚未填入 BOOKING_URL。\n把 section 內的 YOUR_BOOKING_URL 換成你的 Google booking page，就能直接打開預約頁。" });
            }
            return;
          }
          break;
      }

      // Fallback
      addMsg({ who: "bot", text: "我懂～我們換個方式。你想「預約」還是「先諮詢」？" });
      setQuickReplies([
        { id: "goal_book", label: "我要預約" },
        { id: "goal_consult", label: "我想先諮詢" }
      ]);
      state.step = "start";
    }

    // Event Listeners
    console.log("[LINE-DEMO] Setting up event listeners...");
    
    const richMenuBtns = document.querySelectorAll("[data-lc-action]");
    console.log("[LINE-DEMO] Found", richMenuBtns.length, "rich menu buttons");
    
    richMenuBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-lc-action");
        console.log("[LINE-DEMO] Rich menu clicked:", action);
        lcTrack("line_demo_richmenu_click", { action });

        if (action === "book") {
          handleUserChoice({ id: "goal_book", label: "我要預約" });
        } else if (action === "consult") {
          handleUserChoice({ id: "goal_consult", label: "我想先諮詢" });
        } else if (action === "promo") {
          handleUserChoice({ id: "goal_promo", label: "看折扣優惠" });
        } else if (action === "service") {
          handleUserChoice({ id: "goal_services", label: "看服務項目" });
        }
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", resetDemo);
      console.log("[LINE-DEMO] Reset button listener attached");
    }

    if (autoBtn) {
      autoBtn.addEventListener("click", async () => {
        console.log("[LINE-DEMO] Auto run started");
        lcTrack("line_demo_autorun");
        resetDemo();

        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        await wait(550);
        handleUserChoice({ id: "goal_book", label: "我要預約" });
        await wait(550);
        handleUserChoice({ id: "svc_nails", label: "美甲/凝膠" });
        await wait(550);
        handleUserChoice({ id: "t_weekday_night", label: "平日晚上" });
        await wait(550);
        handleUserChoice({ id: "p_new", label: "新客優惠" });
      });
      console.log("[LINE-DEMO] Auto button listener attached");
    }

    // Initialize
    console.log("[LINE-DEMO] Initialization complete!");
    boot();
    lcTrack("line_demo_view");
  }
})();
