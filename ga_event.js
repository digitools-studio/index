// 範本「試用預覽」按鈕
document.addEventListener('click', function(e) {
  if (e.target.closest('a[href="#customization"]')) {
    gtag('event', 'select_template', {
      event_category: 'template',
      event_label: '試用預覽'
    });
  }
});

// 實際案例 demo 連結
document.addEventListener('click', function(e) {
  if (e.target.closest('a[href$=".html"][href*="demo"]')) {
    gtag('event', 'view_demo_case', {
      event_category: 'case',
      event_label: e.target.closest('a').getAttribute('href')
    });
  }
});

// 免費諮詢 CTA
document.addEventListener('click', function(e) {
  if (e.target.closest('a[href="#consultant"],a[href*="lin.ee"]')) {
    gtag('event', 'free_consult', {
      event_category: 'cta',
      event_label: '免費諮詢'
    });
  }
});

// 聯絡表單送出
const contactForm = document.querySelector('form[action*="formspree"]');
if (contactForm) {
  contactForm.addEventListener('submit', function() {
    gtag('event', 'contact_submit', {
      event_category: 'contact',
      event_label: '聯絡表單'
    });
  });
}

// 1. 頁面登陸（載入）事件
window.addEventListener('DOMContentLoaded', function() {
  gtag('event', 'page_land', {
    event_category: 'page',
    event_label: window.location.pathname
  });
});

// 2. 頁面瀏覽（可用於 SPA 路由切換時重複呼叫）
window.addEventListener('load', function() {
  gtag('event', 'page_view', {
    event_category: 'page',
    event_label: document.title
  });
});

// 3. 滾動行為（首次滾動超過 300px 時觸發一次）
let scrollTracked = false;
window.addEventListener('scroll', function() {
  if (!scrollTracked && window.scrollY > 300) {
    gtag('event', 'scroll_depth', {
      event_category: 'engagement',
      event_label: 'Scrolled 300px'
    });
    scrollTracked = true;
  }
});

// 4. Line 資訊點擊
document.addEventListener('click', function(e) {
  if (e.target.closest('a[href*="line.me"],a[href*="lin.ee"]')) {
    gtag('event', 'line_info', {
      event_category: 'social',
      event_label: e.target.closest('a').getAttribute('href')
    });
  }
});