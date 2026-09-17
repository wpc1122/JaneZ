/* 登录 / 注册 页逻辑 */
(function () {
  'use strict';
  const A = window.JANEZ_AUTH;
  let mode = 'login';

  const tabs = document.querySelectorAll('.auth-tab');
  const form = document.getElementById('authForm');
  const msg = document.getElementById('authMsg');
  const submitBtn = document.getElementById('authSubmit');
  const pass2Wrap = document.getElementById('authPass2Wrap');
  const pass2Input = document.getElementById('authPass2');

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

  // 已登录则直接进入对应页面
  const sess = A.currentSession();
  if (sess) {
    location.replace(sess.role === 'admin' ? 'admin.html' : 'index.html');
    return;
  }

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
        const s = { user, role: 'user', ts: Date.now() };
        A.setSession(s);
        showMsg('注册成功，已为你登录', false);
        setTimeout(() => location.replace('index.html'), 700);
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
      setTimeout(() => location.replace(s.role === 'admin' ? 'admin.html' : 'index.html'), 500);
    } catch (err) {
      showMsg('登录失败：' + err.message, true);
      submitBtn.disabled = false; submitBtn.textContent = '登 录';
    }
  });
})();
