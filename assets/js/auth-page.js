/* 登录 / 注册 页逻辑（含已登录账号卡与退出） */
(function () {
  'use strict';
  const A = window.JANEZ_AUTH;
  /* 守卫：若账号层 auth.js 未加载成功（缓存/网络异常），明确提示而非静默崩溃，
     否则下方 form submit 监听器不会绑定，「登录」按钮点了无任何反应 */
  if (!A || typeof A.verify !== 'function' || typeof A.register !== 'function') {
    const m0 = document.getElementById('authMsg');
    if (m0) {
      m0.textContent = '页面组件未加载完成。请 Ctrl+F5 强制刷新后重试。';
      m0.classList.add('err');
    }
    return;
  }
  let mode = 'login';

  const tabs = document.querySelectorAll('.auth-tab');
  const form = document.getElementById('authForm');
  const msg = document.getElementById('authMsg');
  const submitBtn = document.getElementById('authSubmit');
  const pass2Wrap = document.getElementById('authPass2Wrap');
  const pass2Input = document.getElementById('authPass2');

  const loggedCard = document.getElementById('authLoggedCard');
  const formCard = document.getElementById('authFormCard');
  const lgdName = document.getElementById('lgdName');
  const lgdRole = document.getElementById('lgdRole');
  const lgdAvatar = document.getElementById('lgdAvatar');
  const lgdAdminBtn = document.getElementById('lgdAdminBtn');
  const lgdLogout = document.getElementById('lgdLogout');

  function showMsg(text, isErr) {
    msg.textContent = text || '';
    msg.classList.toggle('err', !!isErr);
    msg.classList.toggle('ok', !!text && !isErr);
  }

  function setMode(m) {
    mode = m;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === m));
    if (m === 'register') {
      pass2Wrap.style.display = '';
      submitBtn.textContent = '注 册';
      document.getElementById('authPass').autocomplete = 'new-password';
    } else {
      pass2Wrap.style.display = 'none';
      submitBtn.textContent = '登 录';
      document.getElementById('authPass').autocomplete = 'current-password';
    }
    showMsg('');
  }
  tabs.forEach(t => t.addEventListener('click', () => setMode(t.dataset.tab)));

  /* ---------- 已登录账号卡 ---------- */
  function showLogged() {
    const s = A.currentSession();
    if (!s) return;
    loggedCard.style.display = '';
    formCard.style.display = 'none';
    lgdName.textContent = s.user;
    lgdAvatar.textContent = s.user.slice(0, 1).toUpperCase();
    const isAdmin = s.role === 'admin';
    lgdRole.textContent = isAdmin ? '网站管理员' : '普通用户（只读）';
    lgdRole.classList.toggle('is-admin', isAdmin);
    lgdAdminBtn.style.display = isAdmin ? '' : 'none';
  }

  lgdLogout.addEventListener('click', () => {
    A.logout();
    loggedCard.style.display = 'none';
    formCard.style.display = '';
    document.getElementById('authUser').value = '';
    document.getElementById('authPass').value = '';
    document.getElementById('authPass2').value = '';
    setMode('login');
    showMsg('已退出登录', false);
  });

  showLogged();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('authUser').value.trim();
    const pass = document.getElementById('authPass').value;

    if (mode === 'register') {
      const pass2 = pass2Input.value;
      if (pass !== pass2) return showMsg('两次输入的口令不一致', true);
      submitBtn.disabled = true; submitBtn.textContent = '注册中…';
      try {
        await A.register(user, pass);
        A.setSession({ user, role: 'user', ts: Date.now() });
        showMsg('注册成功，已为你登录', false);
        setTimeout(showLogged, 500);
      } catch (err) {
        showMsg(err.message, true);
        submitBtn.disabled = false; submitBtn.textContent = '注 册';
      }
      return;
    }

    // 登录
    submitBtn.disabled = true; submitBtn.textContent = '登录中…';
    try {
      const s = await A.verify(user, pass);
      if (!s) { showMsg('用户名或口令错误', true); submitBtn.disabled = false; submitBtn.textContent = '登 录'; return; }
      s.ts = Date.now();
      A.setSession(s);
      showMsg('登录成功', false);
      setTimeout(showLogged, 500);
    } catch (err) {
      showMsg('登录失败：' + err.message, true);
      submitBtn.disabled = false; submitBtn.textContent = '登 录';
    }
  });
})();
