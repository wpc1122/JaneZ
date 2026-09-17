/* ============================================================
 *  张靓颖 Jane Zhang · 官方资料站 — 交互逻辑
 * ============================================================ */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- 渐变色板（用于生成封面视觉） ---------- */
  const PALETTE = [
    ['#8e7bf0', '#2b2258'],
    ['#d8b46c', '#6b4a1e'],
    ['#e2698f', '#5b2140'],
    ['#4fa8c9', '#1c4457'],
    ['#7ac9a0', '#1f5040'],
    ['#c987d8', '#432353'],
    ['#d97a5c', '#5e2a1c'],
    ['#6b8ee0', '#22335e'],
    ['#b8a05c', '#4a3d1a']
  ];
  const grad = (i) => {
    const p = PALETTE[i % PALETTE.length];
    return `--c1:${p[0]};--c2:${p[1]}`;
  };

  /* ================= 渲染：首屏数据 ================= */
  function renderHeroStats() {
    $('#heroStats').innerHTML = PROFILE.stats.map(s => `
      <div class="hs-item">
        <div class="hs-n">${s.n}<small>${s.u}</small></div>
        <div class="hs-l">${s.l}</div>
      </div>`).join('');
  }

  /* ================= 渲染：最新动态 ================= */
  function renderNews() {
    $('#newsGrid').innerHTML = NEWS.map(n => `
      <article class="news-card reveal">
        <div class="nc-top">
          <span class="nc-tag">${n.tag}</span>
          <span class="nc-date">${n.date}</span>
        </div>
        <h3 class="nc-title">${n.title}</h3>
        <p class="nc-desc">${n.desc}</p>
      </article>`).join('');
  }

  /* ================= 渲染：个人档案 ================= */
  function renderProfile() {
    $('#pcIntro').textContent = PROFILE.intro;
    $('#pcTags').innerHTML = ['流行 Pop', 'R&B', '爵士 Jazz', '灵魂乐 Soul', '海豚音', 'OST 女王']
      .map(t => `<span>${t}</span>`).join('');
    $('#factsTable').innerHTML = PROFILE.facts.map(f => `
      <div class="fact-row">
        <span class="fact-k">${f.k}</span>
        <span class="fact-v">${f.v}</span>
      </div>`).join('');
  }

  /* ================= 渲染：星路历程 ================= */
  function renderTimeline() {
    $('#timeline').innerHTML = TIMELINE.map(t => `
      <div class="tl-item reveal">
        <div class="tl-card">
          <div class="tl-year">${t.year}<span>${t.date}</span></div>
          <h3 class="tl-title">${t.title}</h3>
          <p class="tl-desc">${t.desc}</p>
        </div>
      </div>`).join('');
  }

  /* ================= 渲染：音乐专辑 ================= */
  const TYPE_LABEL = { studio: '录音室专辑', ep: '迷你专辑 EP', live: '现场专辑', best: '精选辑' };

  function renderAlbums(filter) {
    const list = filter === 'all' ? ALBUMS : ALBUMS.filter(a => a.type === filter);
    if (!list.length) {
      $('#albumGrid').innerHTML = '<p style="color:var(--muted)">暂无该分类作品。</p>';
      return;
    }
    $('#albumGrid').innerHTML = list.map((a, i) => `
      <article class="album-card reveal" style="animation-delay:${i * 60}ms">
        <div class="ac-cover">
          <div class="ac-art" style="${grad(i)}">
            <span class="ac-ring"></span>
            <span class="ac-name">${a.name}</span>
          </div>
          <span class="ac-type">${TYPE_LABEL[a.type]}</span>
        </div>
        <div class="ac-body">
          <div class="ac-meta">
            <span class="ac-date">${a.date}</span>
            <span>${a.songs ? '· ' + a.songs + ' 首曲目' : ''}</span>
          </div>
          <h3 class="ac-cn">${a.cn}</h3>
          <p class="ac-desc">${a.desc}</p>
          <div class="ac-foot">
            ${a.award ? `<p class="ac-award">✦ ${a.award}</p>` : ''}
            <p class="ac-label">发行：${a.label}</p>
          </div>
        </div>
      </article>`).join('');
    observeReveal();
  }

  /* ================= 渲染：影视金曲 ================= */
  function renderOST() {
    $('#ostList').innerHTML = OSTS.map(o => `
      <div class="ost-row">
        <span class="ost-year">${o.year}</span>
        <div>
          <div class="ost-song">${o.song}<span class="ost-work">${o.work}</span></div>
          <p class="ost-note">${o.note}</p>
        </div>
      </div>`).join('');
  }

  /* ================= 渲染：国际作品 ================= */
  function renderGlobal() {
    $('#globalGrid').innerHTML = GLOBAL_SONGS.map((g, i) => `
      <div class="global-card reveal" style="animation-delay:${i * 60}ms">
        <div class="gc-year">${g.year}</div>
        <h3 class="gc-name">${g.name}</h3>
        <p class="gc-note">${g.note}</p>
      </div>`).join('');
  }

  /* ================= 渲染：巡演 ================= */
  function renderTours() {
    $('#tourList').innerHTML = TOURS.map(t => `
      <div class="tour-item reveal ${t.name === '追' ? 'current' : ''}">
        <div>
          <div class="ti-name">${t.name}${t.name === '追' ? '<span class="ti-badge">进行中</span>' : ''}</div>
          <div class="ti-en">${t.en}</div>
        </div>
        <p class="ti-note">${t.note}</p>
        <div class="ti-year">${t.year}</div>
      </div>`).join('');
  }

  /* ================= 渲染：荣誉 ================= */
  function renderAwards(cat) {
    const list = cat === 'all' ? AWARDS : AWARDS.filter(a => a.cat === cat);
    $('#awardList').innerHTML = list.map((a, i) => `
      <div class="award-item reveal" style="animation-delay:${i * 40}ms">
        <span class="aw-year">${a.year}</span>
        <span class="aw-name">${a.name}</span>
      </div>`).join('');
    observeReveal();
  }

  /* ================= 渲染：影视与综艺 ================= */
  function renderScreen() {
    $('#screenList').innerHTML = SCREENS.map(s => `
      <div class="screen-item reveal">
        <span class="si-cat">${s.cat}</span>
        <div>
          <div class="si-title">${s.title}</div>
          <div class="si-role">${s.role} · ${s.note}</div>
        </div>
        <span class="si-year">${s.year}</span>
      </div>`).join('');
    $('#varietyList').innerHTML = VARIETY.map(v => `
      <div class="variety-item reveal">
        <span class="vi-year">${v.year}</span>
        <span class="vi-name">${v.name}</span>
        <span class="vi-role">${v.role}</span>
      </div>`).join('');
  }

  /* ================= 渲染：图集 & 灯箱 ================= */
  let galleryIndex = 0;

  function renderGallery() {
    $('#galleryGrid').innerHTML = GALLERY.map((g, i) => `
      <div class="gallery-item reveal" data-i="${i}" style="animation-delay:${i * 50}ms">
        <div class="gi-art" style="${grad(g.tone)}"></div>
        <div class="gi-mask">
          <div class="gi-title">${g.title}</div>
          <div class="gi-sub">${g.sub}</div>
        </div>
      </div>`).join('');

    $$('#galleryGrid .gallery-item').forEach(el => {
      el.addEventListener('click', () => openLightbox(Number(el.dataset.i)));
    });
  }

  function openLightbox(i) {
    galleryIndex = i;
    const g = GALLERY[i];
    const lb = $('#lightbox');
    $('#lbArt').setAttribute('style', grad(g.tone));
    $('#lbTitle').textContent = g.title;
    $('#lbSub').textContent = g.sub;
    lb.classList.add('show');
    document.body.classList.add('locked');
  }

  function closeLightbox() {
    $('#lightbox').classList.remove('show');
    document.body.classList.remove('locked');
  }

  function stepLightbox(d) {
    galleryIndex = (galleryIndex + d + GALLERY.length) % GALLERY.length;
    openLightbox(galleryIndex);
  }

  /* ================= 渲染：平台直达 ================= */
  const PLAT_EN = { 'QQ音乐': 'QQ MUSIC', '网易云音乐': 'NETEASE MUSIC', '酷狗音乐': 'KUGOU MUSIC', '微博': 'WEIBO' };
  function renderPlatforms() {
    $('#platformGrid').innerHTML = PLATFORMS.map(p => `
      <a class="contact-card reveal" href="${p.url}" target="_blank" rel="noopener">
        <span class="cc-name">${p.name}</span>
        <span class="cc-en">${PLAT_EN[p.name] || ''}</span>
        <span class="cc-arrow">前往 →</span>
      </a>`).join('');
  }

  /* ================= 滚动显现 ================= */
  let io;
  function observeReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(el => el.classList.add('in'));
      return;
    }
    if (io) io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });
    $$('.reveal:not(.in)').forEach(el => io.observe(el));
  }

  /* ================= 导航状态 ================= */
  function initNav() {
    const header = $('#header');
    const navs = $$('#nav .nl');
    const sections = navs.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const bar = $('#progressBar');

    function onScroll() {
      const y = window.scrollY;
      header.classList.toggle('solid', y > 40);
      $('#toTop').classList.toggle('show', y > 600);

      const docH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';

      let idx = -1;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= 140) idx = i;
      });
      navs.forEach((n, i) => n.classList.toggle('active', i === idx));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    navs.forEach(n => n.addEventListener('click', () => {
      $('#nav').classList.remove('open');
      $('#menuBtn').classList.remove('on');
    }));

    $('#menuBtn').addEventListener('click', function () {
      this.classList.toggle('on');
      $('#nav').classList.toggle('open');
    });
  }

  /* ================= 主题切换 ================= */
  function initTheme() {
    const saved = localStorage.getItem('zly-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    $('#themeBtn').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('zly-theme', next);
    });
  }

  /* ================= 灯箱事件 ================= */
  function initLightbox() {
    $('.lb-close').addEventListener('click', closeLightbox);
    $('.lb-prev').addEventListener('click', () => stepLightbox(-1));
    $('.lb-next').addEventListener('click', () => stepLightbox(1));
    $('#lightbox').addEventListener('click', e => {
      if (e.target.id === 'lightbox') closeLightbox();
    });
    document.addEventListener('keydown', e => {
      if (!$('#lightbox').classList.contains('show')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }

  /* ================= 初始化 ================= */
  function init() {
    renderHeroStats();
    renderNews();
    renderProfile();
    renderTimeline();
    renderAlbums('all');
    renderOST();
    renderGlobal();
    renderTours();
    renderAwards('all');
    renderScreen();
    renderGallery();
    renderPlatforms();

    // 筛选
    $('#albumFilter').addEventListener('click', e => {
      const b = e.target.closest('.fb');
      if (!b) return;
      $$('#albumFilter .fb').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderAlbums(b.dataset.t);
    });
    $('#awardFilter').addEventListener('click', e => {
      const b = e.target.closest('.fb');
      if (!b) return;
      $$('#awardFilter .fb').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderAwards(b.dataset.c);
    });

    initNav();
    initTheme();
    initLightbox();
    observeReveal();

    $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // 载入动画结束
    window.addEventListener('load', () => {
      setTimeout(() => $('#preloader').classList.add('done'), 500);
    });
    setTimeout(() => $('#preloader').classList.add('done'), 2600);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
