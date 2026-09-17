/* 登录 / 注册 页逻辑（背景轮播 + 登录后隐藏表单 + 运行时兜底诊断） */
(function () {
  'use strict';
  const A = window.JANEZ_AUTH;

  const $ = id => document.getElementById(id);
  const tabs = document.querySelectorAll('.auth-tab');
  const form = $('authForm');
  const msg = $('authMsg');
  const submitBtn = $('authSubmit');
  const pass2Wrap = $('authPass2Wrap');
  const pass2Input = $('authPass2');

  const loggedCard = $('authLoggedCard');
  const formCard = $('authFormCard');
  const lgdName = $('lgdName');
  const lgdRole = $('lgdRole');
  const lgdAvatar = $('lgdAvatar');
  const lgdAdminBtn = $('lgdAdminBtn');
  const lgdLogout = $('lgdLogout');
  const lgdSwitch = $('lgdSwitch');
  const lgdPerm = $('lgdPerm');
  const lgdType = $('lgdType');

  const diag = $('authDiag');
  const diagReload = $('authDiagReload');

  let mode = 'login';

  /* ---------- 背景轮播：淡入淡出切换（仅当前张 .on 可见） ---------- */
  function initCarousel() {
    const slides = Array.from(document.querySelectorAll('.cslide'));
    if (slides.length < 2) return;
    let cur = 0;
    slides.forEach((s, i) => s.classList.toggle('on', i === 0));
    setInterval(() => {
      slides[cur].classList.remove('on');
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add('on');
    }, 5000);
  }

  function showMsg(text, isErr) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.classList.toggle('err', !!isErr);
    msg.classList.toggle('ok', !!text && !isErr);
  }

  /* ---------- 运行时兜底：账号层未加载成功时给明确反馈 ---------- */
  const authReady = A && typeof A.verify === 'function' && typeof A.register === 'function';
  if (!authReady) {
    initCarousel();
    if (diag) diag.style.display = '';
    if (diagReload) diagReload.addEventListener('click', () => location.reload());
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      showMsg('登录组件未就绪，请先点「强制刷新」再试。', true);
    });
    return;
  }

  function setMode(m) {
    mode = m;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === m));
    if (m === 'register') {
      pass2Wrap.style.display = '';
      submitBtn.textContent = '注 册';
      $('authPass').autocomplete = 'new-password';
    } else {
      pass2Wrap.style.display = 'none';
      submitBtn.textContent = '登 录';
      $('authPass').autocomplete = 'current-password';
    }
    showMsg('');
  }
  tabs.forEach(t => t.addEventListener('click', () => setMode(t.dataset.tab)));

  /* ---------- 显示 / 隐藏 卡片（登录后隐藏表单，只留账号卡） ---------- */
  function showLogged() {
    const s = A.currentSession();
    if (!s) { loggedCard.style.display = 'none'; formCard.style.display = ''; return; }
    loggedCard.style.display = '';
    formCard.style.display = 'none';              // 登录成功后去掉下方登录框
    lgdName.textContent = s.user;
    lgdAvatar.textContent = s.user.slice(0, 1).toUpperCase();
    const isAdmin = s.role === 'admin';
    lgdRole.textContent = isAdmin ? '网站管理员' : '普通用户（只读）';
    lgdRole.classList.toggle('is-admin', isAdmin);
    lgdPerm.textContent = isAdmin ? '全部编辑' : '只读浏览';
    lgdType.textContent = s.builtin ? '内置管理员' : '注册用户';
    lgdAdminBtn.style.display = isAdmin ? '' : 'none';
  }

  /* 切换账号：清会话，重新展示登录表单 */
  lgdSwitch.addEventListener('click', () => {
    A.logout();
    ['authUser', 'authPass', 'authPass2'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    setMode('login');
    showLogged();
    showMsg('已切换，请输入要登录的账号。', false);
    const u = $('authUser'); if (u) u.focus();
  });

  /* 退出：清会话，重新展示登录表单 */
  lgdLogout.addEventListener('click', () => {
    A.logout();
    showLogged();
    showMsg('已退出登录', false);
  });

  showLogged();

  /* ---------- 登录 / 注册 提交（监听器无条件绑定，按钮永远有效） ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const wasLogin = mode === 'login';
    const user = $('authUser').value.trim();
    const pass = $('authPass').value;
    const restore = () => { submitBtn.disabled = false; submitBtn.textContent = wasLogin ? '登 录' : '注 册'; };

    if (mode === 'register') {
      const pass2 = pass2Input.value;
      if (user.length < 2) { restore(); return showMsg('用户名至少 2 个字符', true); }
      if (pass.length < 6) { restore(); return showMsg('口令至少 6 位', true); }
      if (pass !== pass2) { restore(); return showMsg('两次输入的口令不一致', true); }
      submitBtn.disabled = true; submitBtn.textContent = '注册中…';
      try {
        await A.register(user, pass);
        A.setSession({ user, role: 'user', ts: Date.now() });
        showMsg('注册成功，已为你登录', false);
        setTimeout(showLogged, 400);
      } catch (err) {
        showMsg(err.message || '注册失败，请重试', true);
      }
      restore();
      return;
    }

    if (!user || !pass) { restore(); return showMsg('请输入用户名和口令', true); }
    submitBtn.disabled = true; submitBtn.textContent = '登录中…';
    try {
      const s = await A.verify(user, pass);
      if (!s) { showMsg('用户名或口令错误', true); restore(); return; }
      s.ts = Date.now();
      A.setSession(s);
      showMsg('登录成功', false);
      setTimeout(showLogged, 400);
    } catch (err) {
      showMsg('登录失败：' + (err.message || '未知错误'), true);
    }
    restore();
  });

  initCarousel();
})();
