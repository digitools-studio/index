// ========================================
// GA4 事件追蹤配置 (digitools-studio)
// 全面覆蓋所有互動點和轉換漏斗
// ========================================

// 1. 頁面瀏覽事件
window.addEventListener('DOMContentLoaded', function() {
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
});

// 2. 滾動深度追蹤（多個檢查點）
let scrollTracked = {};
const scrollDepths = [300, 800, 1500, 3000];
window.addEventListener('scroll', function() {
  scrollDepths.forEach(depth => {
    if (!scrollTracked[depth] && window.scrollY > depth) {
      gtag('event', 'scroll_depth', {
        event_category: 'engagement',
        scroll_depth: depth,
        page_section: getPageSection()
      });
      scrollTracked[depth] = true;
    }
  });
});

// 輔助函數：取得當前頁面區塊
function getPageSection() {
  const sections = ['hero', 'features', 'demo', 'cases', 'line-demo', 'data-analytics', 'consultant'];
  for (let section of sections) {
    const el = document.getElementById(section);
    if (el && el.getBoundingClientRect().top < window.innerHeight) {
      return section;
    }
  }
  return 'unknown';
}

// ========================================
// 模板與功能類別追蹤
// ========================================

// 3. 模板試用預覽按鈕
document.addEventListener('click', function(e) {
  if (e.target.closest('a[href="#customization"]')) {
    gtag('event', 'select_template', {
      event_category: 'template',
      event_label: '試用預覽',
      section: 'features'
    });
  }
});

// ========================================
// 實際案例追蹤
// ========================================

// 4. 案例卡片點擊追蹤
document.addEventListener('click', function(e) {
  const caseLink = e.target.closest('a[href*="demo"], a[href*=".html"]');
  if (caseLink) {
    const href = caseLink.getAttribute('href');
    const caseCard = caseLink.closest('[class*="rounded-lg shadow"]');
    const caseTitle = caseCard?.querySelector('h3')?.textContent || 'Unknown';
    
    if (href.includes('demo') || href.includes('tool') || href.includes('github')) {
      gtag('event', 'view_case_demo', {
        event_category: 'case',
        event_label: caseTitle,
        case_url: href,
        case_type: href.includes('tool') ? 'tool' : 'website'
      });
    }
  }
});

// ========================================
// LINE 行銷自動化 Demo 追蹤
// ========================================

// 5. LINE Demo 區塊互動追蹤
// 此部分由 index.html 內的 lcTrack 函數處理，但補充 GA 層級的追蹤

// Rich Menu 按鈕點擊
document.addEventListener('click', function(e) {
  const richMenuBtn = e.target.closest('[data-lc-action]');
  if (richMenuBtn) {
    const action = richMenuBtn.getAttribute('data-lc-action');
    gtag('event', 'line_demo_menu_click', {
      event_category: 'line_demo',
      event_label: action,
      interaction_type: 'rich_menu'
    });
  }
});

// 重置 Demo 按鈕
document.addEventListener('click', function(e) {
  if (e.target.closest('#lcReset')) {
    gtag('event', 'line_demo_reset', {
      event_category: 'line_demo',
      event_label: '重置 Demo'
    });
  }
});

// 自動跑流程按鈕
document.addEventListener('click', function(e) {
  if (e.target.closest('#lcAutoRun')) {
    gtag('event', 'line_demo_auto_run', {
      event_category: 'line_demo',
      event_label: '自動跑一次流程'
    });
  }
});

// ========================================
// 數據分析區塊追蹤
// ========================================

// 6. 數據分析區塊滾動進入
const dataAnalyticsSection = document.getElementById('data-analytics');
if (dataAnalyticsSection) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gtag('event', 'view_section', {
          event_category: 'engagement',
          section_name: 'data_analytics',
          section_title: '數據分析 × 競品對照'
        });
        observer.unobserve(entry.target);
      }
    });
  });
  observer.observe(dataAnalyticsSection);
}

// ========================================
// 聯絡與轉換事件
// ========================================

// 7. LINE 官方帳號點擊（真實入口）
document.addEventListener('click', function(e) {
  if (e.target.closest('a[href*="lin.ee"], a[href*="line.me"]')) {
    const href = e.target.closest('a').getAttribute('href');
    gtag('event', 'add_to_cart', { // GA 標準事件
      event_category: 'conversion',
      event_label: '加入 LINE 官方帳號',
      conversion_type: 'line_oa'
    });
    // 自訂事件
    gtag('event', 'line_oa_click', {
      event_category: 'cta',
      event_label: '加入 LINE',
      line_url: href
    });
  }
});

// 8. 免費諮詢按鈕追蹤
document.addEventListener('click', function(e) {
  const consultBtn = e.target.closest('a[href="#consultant"], a[href*="forms"]');
  if (consultBtn) {
    const section = consultBtn.closest('section')?.id || 'unknown';
    gtag('event', 'begin_checkout', { // GA 標準事件
      event_category: 'conversion',
      event_label: '免費諮詢'
    });
    // 自訂事件
    gtag('event', 'free_consult_click', {
      event_category: 'cta',
      event_label: '免費諮詢',
      from_section: section
    });
  }
});

// 9. 聯絡表單追蹤（Formspree 或自訂表單）
document.addEventListener('submit', function(e) {
  const form = e.target;
  if (form.action && form.action.includes('formspree')) {
    gtag('event', 'generate_lead', { // GA 標準事件
      event_category: 'conversion',
      event_label: '聯絡表單提交'
    });
    gtag('event', 'contact_form_submit', {
      event_category: 'form',
      form_id: form.id || 'contact_form',
      form_fields: Array.from(form.querySelectorAll('input, textarea')).map(f => f.name).join(',')
    });
  }
});

// ========================================
// 分享與社群互動
// ========================================

// 10. 社群連結點擊
document.addEventListener('click', function(e) {
  const socialLink = e.target.closest('a[href*="github"], a[href*="linkedin"], a[href*="twitter"], a[href*="facebook"], a[href*="instagram"]');
  if (socialLink) {
    const href = socialLink.getAttribute('href');
    const platform = new URL(href).hostname.split('.')[0];
    
    gtag('event', 'share', {
      method: platform,
      content_type: 'social_link',
      item_id: platform
    });
    
    gtag('event', 'social_link_click', {
      event_category: 'social',
      event_label: platform,
      social_url: href
    });
  }
});

// ========================================
// 時間與購買行為事件
// ========================================

// 11. 頁面停留時間追蹤
let pageVisitStartTime = Date.now();
window.addEventListener('beforeunload', function() {
  const visitDuration = Math.round((Date.now() - pageVisitStartTime) / 1000);
  
  if (visitDuration > 10) { // 只追蹤超過 10 秒的訪問
    gtag('event', 'page_engagement', {
      event_category: 'engagement',
      engagement_time_msec: visitDuration * 1000,
      page_title: document.title
    });
  }
});

// ========================================
// 錯誤與性能監控
// ========================================

// 12. 全局錯誤捕捉
window.addEventListener('error', function(event) {
  gtag('event', 'exception', {
    description: event.message,
    fatal: false
  });
});

// 13. 未捕捉的 Promise 拒絕
window.addEventListener('unhandledrejection', function(event) {
  gtag('event', 'exception', {
    description: 'Unhandled Promise: ' + event.reason,
    fatal: false
  });
});

// ========================================
// 視口進入事件（Intersection Observer）
// ========================================

// 14. 各區塊進入視口時追蹤
const sections = [
  { id: 'features', name: 'Features' },
  { id: 'cases', name: 'Cases' },
  { id: 'line-demo', name: 'LINE Demo' },
  { id: 'data-analytics', name: 'Data Analytics' },
  { id: 'consultant', name: 'Consultant' }
];

sections.forEach(section => {
  const el = document.getElementById(section.id);
  if (el) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gtag('event', 'view_item', {
            items: [{
              item_id: section.id,
              item_name: section.name,
              item_category: 'page_section'
            }]
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  }
});

// ========================================
// 自訂追蹤函數（可供 HTML 中使用）
// ========================================

// 全局追蹤函數（與 index.html 中的 lcTrack 相容）
window.trackEvent = function(eventName, parameters = {}) {
  gtag('event', eventName, parameters);
};

// 頁面特定事件記錄函數
window.logPageEvent = function(action, category, label, value = null) {
  const eventData = {
    event_category: category,
    event_label: label
  };
  
  if (value !== null) {
    eventData.value = value;
  }
  
  gtag('event', action, eventData);
};