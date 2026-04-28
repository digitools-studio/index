// =============================================================
// ga_event.js — Digitools Studio (index.html)
// 自訂事件識別前綴：ds_  (Digitools Studio)
// 版本：2.0  |  2026-04
//
// 涵蓋追蹤點：
//  01  Section 進入視口
//  02  滾動深度（25 / 50 / 75 / 90 %）
//  03  Nav 連結點擊
//  04  Header「諮詢案件」CTA
//  05  Hero CTA 點擊
//  06  Mobile Menu 開關
//  07  作品集 Filter 切換
//  08  作品集 Card 點擊
//  09  Solutions Tab 切換
//  10  各區塊「諮詢/預約」CTA 點擊
//  11  FAQ Accordion 展開
//  12  LINE CTA 點擊
//  13  Email Modal 開啟／關閉
//  14  Email Form 提交嘗試
//  15  Email Form 驗證錯誤 / 伺服器錯誤（MutationObserver）
//  16  Email Form 成功送出（MutationObserver）
//  17  客戶見證「查看作品」連結點擊
//  18  外部連結點擊（outbound）
//  19  Footer 社群連結點擊
//  20  頁面離開時停留時間
// =============================================================

window.addEventListener('DOMContentLoaded', function () {

  // ── 0. 安全 gtag 包裝（確保 gtag 已定義才呼叫）─────────────
  function track(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params || {});
    }
  }


  // ────────────────────────────────────────────────────────────
  // 01  Section 進入視口追蹤
  // ────────────────────────────────────────────────────────────
  var sectionMap = {
    'capabilities': '服務能力',
    'scope':        '承接案型',
    'portfolio':    '作品集',
    'solutions':    '解決方案',
    'process':      '合作流程',
    'testimonials': '客戶見證',
    'faq':          '常見問題',
    'contact':      '聯絡諮詢'
  };

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        track('ds_section_view', {
          section_id:   id,
          section_name: sectionMap[id] || id
        });
        sectionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  Object.keys(sectionMap).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });


  // ────────────────────────────────────────────────────────────
  // 02  滾動深度追蹤（25 / 50 / 75 / 90 %）
  // ────────────────────────────────────────────────────────────
  var scrollDepths  = [25, 50, 75, 90];
  var scrollTracked = {};

  window.addEventListener('scroll', function () {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((window.scrollY / scrollable) * 100);
    scrollDepths.forEach(function (depth) {
      if (!scrollTracked[depth] && pct >= depth) {
        track('ds_scroll_depth', { depth_percent: depth });
        scrollTracked[depth] = true;
      }
    });
  }, { passive: true });


  // ────────────────────────────────────────────────────────────
  // 03  Nav 連結點擊
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('header nav a, #mobile-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      track('ds_nav_click', {
        link_text: link.textContent.trim(),
        link_href: link.getAttribute('href') || ''
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 04  Header「諮詢案件」CTA
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('header a[href="#contact"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      track('ds_cta_click', {
        cta_label:    btn.textContent.trim(),
        cta_location: 'header'
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 05  Hero CTA 點擊
  // ────────────────────────────────────────────────────────────
  var heroSection = document.querySelector('section.pt-28');
  if (heroSection) {
    heroSection.querySelectorAll('a').forEach(function (btn) {
      btn.addEventListener('click', function () {
        track('ds_hero_cta_click', {
          cta_label: btn.textContent.trim(),
          cta_href:  btn.getAttribute('href') || ''
        });
      });
    });
  }


  // ────────────────────────────────────────────────────────────
  // 06  Mobile Menu 開關
  // ────────────────────────────────────────────────────────────
  var mobileMenuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenu    = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      var isCurrentlyHidden = mobileMenu.classList.contains('hidden');
      track('ds_mobile_menu_toggle', {
        action: isCurrentlyHidden ? 'open' : 'close'
      });
    });
  }


  // ────────────────────────────────────────────────────────────
  // 07  作品集 Filter 按鈕點擊
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('.portfolio-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      track('ds_portfolio_filter_click', {
        filter_value: btn.dataset.filter,
        filter_label: btn.textContent.trim()
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 08  作品集 Card 點擊
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('.portfolio-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var titleEl    = card.querySelector('h3');
      var title      = titleEl ? titleEl.textContent.trim() : '';
      var category   = card.dataset.cat || '';
      var href       = card.tagName === 'A' ? (card.getAttribute('href') || '') : '';
      var isExternal = href.indexOf('http') === 0;
      track('ds_portfolio_card_click', {
        card_title:    title,
        card_category: category,
        card_url:      href,
        is_external:   isExternal
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 09  Solutions Tab 切換
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('.sol-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      track('ds_solutions_tab_switch', {
        tab_value: btn.dataset.tab,
        tab_label: btn.textContent.trim()
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 10  各區塊「諮詢 / 預約」CTA 點擊
  // ────────────────────────────────────────────────────────────
  ['scope', 'solutions', 'process', 'faq'].forEach(function (sectionId) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    section.querySelectorAll('a[href="#contact"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        track('ds_consult_cta_click', {
          cta_label:    btn.textContent.trim(),
          cta_location: sectionId
        });
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 11  FAQ Accordion 展開
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('#faq details').forEach(function (detail) {
    detail.addEventListener('toggle', function () {
      if (detail.open) {
        var spanEl = detail.querySelector('summary span');
        track('ds_faq_expand', {
          question_text: spanEl ? spanEl.textContent.trim() : ''
        });
      }
    });
  });


  // ────────────────────────────────────────────────────────────
  // 12  LINE CTA 點擊
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('a[href*="lin.ee"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var location = 'unknown';
      if (link.closest('#contact'))    location = 'contact_section';
      else if (link.closest('footer')) location = 'footer';
      else if (link.closest('.fixed')) location = 'floating_button';
      track('ds_line_cta_click', {
        cta_location: location,
        cta_label:    link.textContent.trim() || 'LINE'
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 13  Email Modal 開啟 / 關閉
  // ────────────────────────────────────────────────────────────
  var emailModalBtn      = document.getElementById('email-modal-btn');
  var emailModalClose    = document.getElementById('email-modal-close');
  var emailModalBackdrop = document.getElementById('email-modal-backdrop');

  if (emailModalBtn) {
    emailModalBtn.addEventListener('click', function () {
      track('ds_email_modal_open', { trigger: 'button' });
    });
  }
  if (emailModalClose) {
    emailModalClose.addEventListener('click', function () {
      track('ds_email_modal_close', { trigger: 'close_button' });
    });
  }
  if (emailModalBackdrop) {
    emailModalBackdrop.addEventListener('click', function () {
      track('ds_email_modal_close', { trigger: 'backdrop' });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('email-modal');
      if (modal && modal.classList.contains('modal-open')) {
        track('ds_email_modal_close', { trigger: 'keyboard_esc' });
      }
    }
  });


  // ────────────────────────────────────────────────────────────
  // 14  Email Form 提交嘗試
  // ────────────────────────────────────────────────────────────
  var emailForm = document.getElementById('email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function () {
      var typeEl   = document.getElementById('ef-type');
      var caseType = typeEl ? (typeEl.value || '未指定') : '未指定';
      track('ds_email_form_submit', { case_type: caseType });
    });
  }


  // ────────────────────────────────────────────────────────────
  // 15  Email Form 驗證 / 伺服器錯誤（MutationObserver）
  // ────────────────────────────────────────────────────────────
  var efError = document.getElementById('ef-error');
  if (efError) {
    new MutationObserver(function () {
      if (!efError.classList.contains('hidden')) {
        var msg       = efError.textContent.trim();
        var errorType = msg.indexOf('必填') !== -1 ? 'validation' : 'server_error';
        track('ds_email_form_error', {
          error_type:    errorType,
          error_message: msg
        });
      }
    }).observe(efError, { attributes: true, attributeFilter: ['class'] });
  }


  // ────────────────────────────────────────────────────────────
  // 16  Email Form 成功送出（MutationObserver）
  // ────────────────────────────────────────────────────────────
  var efSuccess = document.getElementById('ef-success');
  if (efSuccess) {
    new MutationObserver(function () {
      if (!efSuccess.classList.contains('hidden')) {
        var typeEl   = document.getElementById('ef-type');
        var caseType = typeEl ? (typeEl.value || '未指定') : '未指定';
        track('ds_email_form_success', { case_type: caseType });
      }
    }).observe(efSuccess, { attributes: true, attributeFilter: ['class'] });
  }


  // ────────────────────────────────────────────────────────────
  // 17  客戶見證「查看作品」連結點擊
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('#testimonials a').forEach(function (link) {
    link.addEventListener('click', function () {
      var card       = link.closest('[class*="rounded"]');
      var nameEl     = card ? card.querySelector('p.font-semibold') : null;
      var clientName = nameEl ? nameEl.textContent.trim() : '';
      track('ds_testimonial_view_work', {
        client_name: clientName,
        link_href:   link.getAttribute('href') || ''
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 18  外部連結點擊（outbound）
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (href.indexOf('digitools') !== -1 || href.indexOf('qrserver.com') !== -1) return;
    link.addEventListener('click', function () {
      var domain = href;
      try { domain = new URL(href).hostname; } catch (e) {}
      track('ds_outbound_click', {
        link_url:    href,
        link_text:   (link.textContent.trim() || link.title || '').substring(0, 100),
        link_domain: domain
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 19  Footer 社群連結點擊
  // ────────────────────────────────────────────────────────────
  document.querySelectorAll('footer a').forEach(function (link) {
    link.addEventListener('click', function () {
      var href     = link.getAttribute('href') || '';
      var platform = 'unknown';
      if (href.indexOf('lin.ee') !== -1 || href.indexOf('line.me') !== -1) platform = 'line';
      else if (href.indexOf('mailto:') === 0)                              platform = 'email';
      track('ds_footer_link_click', {
        platform:  platform,
        link_href: href
      });
    });
  });


  // ────────────────────────────────────────────────────────────
  // 20  頁面離開：停留時間 + 最深滾動深度
  // ────────────────────────────────────────────────────────────
  var pageStartTime = Date.now();
  window.addEventListener('beforeunload', function () {
    var durationSec = Math.round((Date.now() - pageStartTime) / 1000);
    if (durationSec < 3) return;
    var maxDepth = 0;
    scrollDepths.forEach(function (d) { if (scrollTracked[d] && d > maxDepth) maxDepth = d; });
    track('ds_page_exit', {
      duration_seconds:     durationSec,
      max_scroll_depth_pct: maxDepth
    });
  });


  // ────────────────────────────────────────────────────────────
  // 全局工具函數（供外部呼叫）
  // ────────────────────────────────────────────────────────────
  window.trackEvent = function (eventName, params) {
    track(eventName, params);
  };

}); // end DOMContentLoaded