/* 登录 / 注册 页逻辑（表单常驻 + 已登录状态条 + 运行时兜底诊断） */
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
  const formHint = $('formHint');

  const loggedCard = $('authLoggedCard');
  const lgdName = $('lgdName');
  const lgdRole = $('lgdRole');
  const lgdAvatar = $('lgdAvatar');
  const lgdAdminBtn = $('lgdAdminBtn');
  const lgdLogout = $('lgdLogout');
  const lgdSwitch = $('lgdSwitch');

  const diag = $('authDiag');
  const diagReload = $('authDiagReload');

  let mode = 'login';

  function showMsg(text, isErr) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.classList.toggle('err', !!isErr);
    msg.classList.toggle('ok', !!text && !isErr);
  }

  /* ---------- 运行时兜底：若账号层 auth.js 未加载成功 ----------
     不静默崩溃——显示诊断条 + 强制刷新按钮，并让表单点击有明确反馈 ---------- */
  const authReady = A && typeof A.verify === 'function' && typeof A.register === 'function';
  if (!authReady) {
    if (diag) diag.style.display = '';
    if (diagReload) diagReload.addEventListener('click', () => location.reload());
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      showMsg('登录组件未就绪，请先点上方「强制刷新」再试。', true);
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

  /* ---------- 已登录：显示状态条（表单常驻，不再整块隐藏，保证登录按钮始终可用） ---------- */
  function showLogged() {
    const s = A.currentSession();
    if (!s) return;
    loggedCard.style.display = '';
    lgdName.textContent = s.user;
    lgdAvatar.textContent = s.user.slice(0, 1).toUpperCase();
    const isAdmin = s.role === 'admin';
    lgdRole.textContent = isAdmin ? '网站管理员' : '普通用户（只读）';
    lgdRole.classList.toggle('is-admin', isAdmin);
    lgdAdminBtn.style.display = isAdmin ? '' : 'none';
    if (formHint) formHint.textContent = '当前已登录为「' + s.user + '」。可切换到其它账号或退出。';
  }
  showLogged();

  /* 切换账号：清本机会话，回到表单重新登录 */
  lgdSwitch.addEventListener('click', () => {
    A.logout();
    loggedCard.style.display = 'none';
    ['authUser', 'authPass', 'authPass2'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    setMode('login');
    showMsg('已切换，请输入要登录的账号。', false);
    $('authUser').focus();
  });

  /* 退出：清本机会话，表单保留可重新登录 */
  lgdLogout.addEventListener('click', () => {
    A.logout();
    loggedCard.style.display = 'none';
    if (formHint) formHint.textContent = '已退出登录，可重新登录。';
    showMsg('已退出登录', false);
  });

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
})();
