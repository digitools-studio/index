// =============================================================
// ga_event.js — Digitools Studio (site-wide)
// 自訂事件識別前綴：ds_  (Digitools Studio)
// 版本：3.2  |  2026-05
//
// 目標：
// 1) 保留既有事件名稱，確保 GA4 歷史報表可延續
// 2) 改用事件委派，降低監聽器數量
// 3) 全站通用（首頁、服務、部落格、聯絡頁、文章頁）
// 4) 增加可擴充 data-ga-event 宣告式追蹤
// =============================================================

(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
      return;
    }
    fn();
  }

  onReady(function () {
    var DS_HOST_ALLOWLIST = ['digitools-studio.github.io', 'localhost', '127.0.0.1'];
    var PATHNAME = (window.location.pathname || '').toLowerCase();
    var IS_SERVICES_PAGE = PATHNAME.indexOf('services.html') !== -1;
    var IS_CONTACT_PAGE = PATHNAME.indexOf('contact.html') !== -1;
    var IS_QUERYMIND_PAGE = PATHNAME.indexOf('querymind.html') !== -1;
    var SCROLL_DEPTHS = [25, 50, 75, 90];
    var scrollTracked = {};
    var maxScrollDepth = 0;
    var exitTracked = false;
    var pageStartTime = Date.now();

    function safeText(value, maxLen) {
      var text = (value || '').toString().trim();
      if (!maxLen || text.length <= maxLen) return text;
      return text.substring(0, maxLen);
    }

    function parseUrl(rawUrl) {
      try {
        return new URL(rawUrl, window.location.href);
      } catch (e) {
        return null;
      }
    }

    function isInternalUrl(rawUrl) {
      var parsed = parseUrl(rawUrl);
      if (!parsed) return true;
      if (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:') return true;
      if (DS_HOST_ALLOWLIST.indexOf(parsed.hostname) !== -1) return true;
      return parsed.hostname === window.location.hostname;
    }

    function track(eventName, params) {
      if (!eventName) return;
      if (typeof window.gtag !== 'function') return;

      var payload = Object.assign({}, params || {}, {
        page_path: window.location.pathname,
        page_title: document.title
      });

      window.gtag('event', eventName, payload);
    }

    function delegate(eventType, selector, handler, options) {
      document.addEventListener(eventType, function (event) {
        var target = event.target.closest(selector);
        if (!target) return;
        handler(event, target);
      }, options || false);
    }

    function getLinkMeta(linkEl) {
      var href = linkEl.getAttribute('href') || '';
      var parsed = parseUrl(href);
      return {
        href: href,
        text: safeText(linkEl.textContent || linkEl.title || '', 100),
        domain: parsed ? parsed.hostname : '',
        isExternal: parsed ? !isInternalUrl(href) : false
      };
    }

    // 01 Section 進入視口追蹤
    var sectionMap = {
      hero: 'QueryMind 首屏',
      'pain-points': 'QueryMind 痛點',
      'before-after': 'QueryMind Before After',
      comparison: 'QueryMind 比較表',
      roles: 'QueryMind 角色情境',
      modules: 'QueryMind 模組架構',
      security: 'QueryMind 安全機制',
      poc: 'QueryMind PoC 流程',
      outcomes: 'QueryMind 成效',
      'final-cta': 'QueryMind Final CTA',
      capabilities: '服務能力',
      scope: '承接案型',
      portfolio: '作品集',
      solutions: '解決方案',
      process: '合作流程',
      testimonials: '客戶見證',
      faq: '常見問題',
      contact: '聯絡諮詢'
    };

    if (typeof window.IntersectionObserver === 'function') {
      var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          track('ds_section_view', {
            section_id: id,
            section_name: sectionMap[id] || id
          });
          sectionObserver.unobserve(entry.target);
        });
      }, { threshold: 0.2 });

      Object.keys(sectionMap).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) sectionObserver.observe(el);
      });
    }

    // 02 滾動深度追蹤（效能優化：rAF + passive）
    var scrollRafId = null;
    function handleScrollDepth() {
      scrollRafId = null;
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var pct = Math.round((window.scrollY / scrollable) * 100);
      if (pct > maxScrollDepth) maxScrollDepth = pct;

      SCROLL_DEPTHS.forEach(function (depth) {
        if (!scrollTracked[depth] && pct >= depth) {
          scrollTracked[depth] = true;
          track('ds_scroll_depth', { depth_percent: depth });
        }
      });
    }

    window.addEventListener('scroll', function () {
      if (scrollRafId !== null) return;
      scrollRafId = window.requestAnimationFrame(handleScrollDepth);
    }, { passive: true });

    // 03 Nav 連結點擊
    delegate('click', 'header nav a, #mobile-menu a', function (event, link) {
      var linkMeta = getLinkMeta(link);
      track('ds_nav_click', {
        link_text: linkMeta.text,
        link_href: linkMeta.href
      });
    });

    // 04 Header「諮詢案件」CTA
    delegate('click', 'header a[href="#contact"], header a[href="contact.html"], header a[href="../contact.html"]', function (event, btn) {
      track('ds_cta_click', {
        cta_label: safeText(btn.textContent, 80),
        cta_location: 'header'
      });
    });

    // 04-1 QueryMind 入口點擊
    delegate('click', 'a[href="querymind.html"], a[href="./querymind.html"], a[href*="querymind.html"]', function (event, link) {
      var href = link.getAttribute('href') || '';
      var sectionEl = link.closest('[id]');
      var entryLocation = 'unknown';

      if (link.closest('header')) entryLocation = 'header';
      else if (sectionEl && sectionEl.id === 'services') entryLocation = 'home_services';
      else if (sectionEl && sectionEl.id === 'querymind') entryLocation = 'services_querymind';
      else if (link.closest('footer')) entryLocation = 'footer';

      track('ds_querymind_entry_click', {
        entry_location: entryLocation,
        source_section: sectionEl ? sectionEl.id : '',
        link_text: safeText(link.textContent, 100),
        link_href: href,
        is_querymind_page: IS_QUERYMIND_PAGE
      });
    });

    // 05 Hero CTA 點擊
    var heroSection = document.querySelector('section.pt-28, section[data-hero], main section:first-of-type');
    if (heroSection) {
      heroSection.addEventListener('click', function (event) {
        var btn = event.target.closest('a');
        if (!btn) return;
        track('ds_hero_cta_click', {
          cta_label: safeText(btn.textContent, 80),
          cta_href: btn.getAttribute('href') || ''
        });
      });
    }

    // 06 Mobile Menu 開關
    var mobileMenuBtn = document.getElementById('mobile-menu-btn');
    var mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', function () {
        var expanded = mobileMenuBtn.getAttribute('aria-expanded');
        var isOpen;

        if (expanded === 'true' || expanded === 'false') {
          isOpen = expanded === 'true';
        } else if (mobileMenu.classList.contains('menu-open')) {
          isOpen = true;
        } else {
          isOpen = !mobileMenu.classList.contains('hidden');
        }

        track('ds_mobile_menu_toggle', {
          action: isOpen ? 'close' : 'open'
        });
      });
    }

    // 07 作品集 Filter 按鈕點擊
    delegate('click', '.portfolio-filter', function (event, btn) {
      track('ds_portfolio_filter_click', {
        filter_value: btn.dataset.filter || '',
        filter_label: safeText(btn.textContent, 80)
      });
    });

    // 08 作品集 Card 點擊
    delegate('click', '.portfolio-card', function (event, card) {
      var titleEl = card.querySelector('h3');
      var href = card.tagName === 'A' ? (card.getAttribute('href') || '') : '';

      track('ds_portfolio_card_click', {
        card_title: titleEl ? safeText(titleEl.textContent, 120) : '',
        card_category: card.dataset.cat || '',
        card_url: href,
        is_external: href ? !isInternalUrl(href) : false
      });
    });

    // 09 Solutions Tab 切換
    delegate('click', '.sol-tab', function (event, btn) {
      track('ds_solutions_tab_switch', {
        tab_value: btn.dataset.tab || '',
        tab_label: safeText(btn.textContent, 80)
      });
    });

    // 10 各區塊「諮詢 / 預約」CTA 點擊
    ['scope', 'solutions', 'process', 'faq'].forEach(function (sectionId) {
      var section = document.getElementById(sectionId);
      if (!section) return;

      section.addEventListener('click', function (event) {
        var btn = event.target.closest('a[href="#contact"], a[href="contact.html"], a[href="../contact.html"]');
        if (!btn) return;
        track('ds_consult_cta_click', {
          cta_label: safeText(btn.textContent, 80),
          cta_location: sectionId
        });
      });
    });

    // 11 FAQ Accordion 展開
    document.querySelectorAll('#faq details').forEach(function (detail) {
      detail.addEventListener('toggle', function () {
        if (!detail.open) return;
        var spanEl = detail.querySelector('summary span') || detail.querySelector('summary');
        track('ds_faq_expand', {
          question_text: spanEl ? safeText(spanEl.textContent, 140) : ''
        });
      });
    });

    // 12 LINE CTA 點擊
    delegate('click', 'a[href*="lin.ee"], a[href*="line.me"]', function (event, link) {
      var location = 'unknown';
      if (link.closest('#contact')) location = 'contact_section';
      else if (link.closest('footer')) location = 'footer';
      else if (link.closest('.fixed')) location = 'floating_button';

      track('ds_line_cta_click', {
        cta_location: location,
        cta_label: safeText(link.textContent, 80) || 'LINE'
      });
    });

    // 13 Email Modal 開啟 / 關閉
    var emailModalBtn = document.getElementById('email-modal-btn');
    var emailModalClose = document.getElementById('email-modal-close');
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

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      var modal = document.getElementById('email-modal');
      if (modal && modal.classList.contains('modal-open')) {
        track('ds_email_modal_close', { trigger: 'keyboard_esc' });
      }
    });

    // 14 Email Form 提交嘗試
    var emailForm = document.getElementById('email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', function () {
        var typeEl = document.getElementById('ef-type');
        var caseType = typeEl ? (typeEl.value || '未指定') : '未指定';
        track('ds_email_form_submit', { case_type: caseType });
      });
    }

    // 15 Email Form 驗證 / 伺服器錯誤（MutationObserver）
    var efError = document.getElementById('ef-error');
    if (efError && typeof window.MutationObserver === 'function') {
      var lastError = '';
      new MutationObserver(function () {
        if (efError.classList.contains('hidden')) return;
        var msg = safeText(efError.textContent, 160);
        if (!msg || msg === lastError) return;
        lastError = msg;

        track('ds_email_form_error', {
          error_type: msg.indexOf('必填') !== -1 ? 'validation' : 'server_error',
          error_message: msg
        });
      }).observe(efError, { attributes: true, attributeFilter: ['class'] });
    }

    // 16 Email Form 成功送出（MutationObserver）
    var efSuccess = document.getElementById('ef-success');
    if (efSuccess && typeof window.MutationObserver === 'function') {
      var successTracked = false;
      new MutationObserver(function () {
        if (efSuccess.classList.contains('hidden')) {
          successTracked = false;
          return;
        }
        if (successTracked) return;
        successTracked = true;

        var typeEl = document.getElementById('ef-type');
        var caseType = typeEl ? (typeEl.value || '未指定') : '未指定';
        track('ds_email_form_success', { case_type: caseType });
      }).observe(efSuccess, { attributes: true, attributeFilter: ['class'] });
    }

    // 17 客戶見證「查看作品」連結點擊
    delegate('click', '#testimonials a', function (event, link) {
      var card = link.closest('[class*="rounded"]');
      var nameEl = card ? card.querySelector('p.font-semibold') : null;

      track('ds_testimonial_view_work', {
        client_name: nameEl ? safeText(nameEl.textContent, 80) : '',
        link_href: link.getAttribute('href') || ''
      });
    });

    // 18 外部連結點擊（outbound）
    delegate('click', 'a[href]', function (event, link) {
      var href = link.getAttribute('href') || '';
      if (!href || href.indexOf('#') === 0) return;
      if (!/^https?:\/\//i.test(href)) return;
      if (href.indexOf('qrserver.com') !== -1) return;
      if (isInternalUrl(href)) return;

      var linkMeta = getLinkMeta(link);
      track('ds_outbound_click', {
        link_url: linkMeta.href,
        link_text: linkMeta.text,
        link_domain: linkMeta.domain
      });
    });

    // 19 Footer 社群連結點擊
    delegate('click', 'footer a', function (event, link) {
      var href = link.getAttribute('href') || '';
      var platform = 'unknown';
      if (href.indexOf('lin.ee') !== -1 || href.indexOf('line.me') !== -1) platform = 'line';
      else if (href.indexOf('mailto:') === 0) platform = 'email';
      else if (href.indexOf('facebook.com') !== -1) platform = 'facebook';
      else if (href.indexOf('instagram.com') !== -1) platform = 'instagram';

      track('ds_footer_link_click', {
        platform: platform,
        link_href: href
      });
    });

    // KPI-A: 服務頁 -> 聯絡頁 CTR
    if (IS_SERVICES_PAGE) {
      delegate('click', 'a[href="contact.html"], a[href="./contact.html"], a[href="/contact.html"], a[href*="/contact.html"]', function (event, link) {
        var sourceEl = link.closest('[id]');
        track('ds_services_to_contact_click', {
          source_section: sourceEl ? sourceEl.id : 'services_page',
          link_text: safeText(link.textContent, 80),
          link_href: link.getAttribute('href') || ''
        });
      });
    }

    // KPI-B: 聯絡表單完成率（start -> submit -> success）
    if (IS_CONTACT_PAGE) {
      var contactForm = document.getElementById('contact-form');
      var contactFormStarted = false;

      if (contactForm) {
        contactForm.addEventListener('input', function () {
          if (contactFormStarted) return;
          contactFormStarted = true;
          track('ds_contact_form_start', {
            form_id: 'contact-form'
          });
        }, { passive: true });

        contactForm.addEventListener('submit', function () {
          var serviceEl = document.getElementById('service');
          track('ds_contact_form_submit', {
            form_id: 'contact-form',
            service_type: serviceEl ? (serviceEl.value || '未指定') : '未指定'
          });
        });
      }

      var params = new URLSearchParams(window.location.search);
      if (params.get('submitted') === '1') {
        track('ds_contact_form_success', {
          form_id: 'contact-form'
        });

        params.delete('submitted');
        var next = window.location.pathname + (params.toString() ? ('?' + params.toString()) : '') + window.location.hash;
        window.history.replaceState({}, document.title, next);
      }
    }

    // 20 頁面離開：停留時間 + 最深滾動深度
    function trackPageExit() {
      if (exitTracked) return;
      exitTracked = true;

      var durationSec = Math.round((Date.now() - pageStartTime) / 1000);
      if (durationSec < 3) return;

      var depth = 0;
      SCROLL_DEPTHS.forEach(function (d) {
        if (scrollTracked[d] && d > depth) depth = d;
      });

      // 若使用者尚未觸發門檻事件，仍記錄實際最大百分比（取整到 5 的倍數）
      if (depth === 0 && maxScrollDepth > 0) {
        depth = Math.min(100, Math.floor(maxScrollDepth / 5) * 5);
      }

      track('ds_page_exit', {
        duration_seconds: durationSec,
        max_scroll_depth_pct: depth
      });

      // KPI-C: 服務頁平均停留時間
      if (IS_SERVICES_PAGE) {
        track('ds_services_page_exit', {
          duration_seconds: durationSec,
          max_scroll_depth_pct: depth
        });
      }
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') trackPageExit();
    });
    window.addEventListener('beforeunload', trackPageExit);
    window.addEventListener('pagehide', trackPageExit);

    // 21 宣告式自訂追蹤：data-ga-event / data-ga-param-*
    delegate('click', '[data-ga-event]', function (event, el) {
      var eventName = el.getAttribute('data-ga-event');
      if (!eventName) return;

      var params = {};
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        if (attr.name.indexOf('data-ga-param-') !== 0) return;
        var key = attr.name.replace('data-ga-param-', '').replace(/-/g, '_');
        params[key] = attr.value;
      });

      if (!params.label) {
        params.label = safeText(el.textContent || el.getAttribute('aria-label') || '', 100);
      }

      track(eventName, params);
    });

    // 全局工具函數（供外部手動呼叫）
    window.trackEvent = function (eventName, params) {
      track(eventName, params);
    };

    window.DSAnalytics = {
      track: track,
      version: '3.2'
    };
  });
})();