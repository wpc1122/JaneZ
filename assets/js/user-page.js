/* 用户详情页逻辑：账号信息 + 建议窗口 */
(function () {
  'use strict';
  const A = window.JANEZ_AUTH;
  const $ = s => document.querySelector(s);

  /* 守卫：账号层未加载成功时回到登录页，避免后续 取 session / 绑定 事件时抛错 */
  if (!A || typeof A.currentSession !== 'function') { location.replace('login.html'); return; }

  const sess = A.currentSession();
  if (!sess) { location.replace('login.html'); return; }

  /* ---------- 账号信息 ---------- */
  const s = sess;
  $('#uName').textContent = s.user;
  $('#uAvatar').textContent = s.user.slice(0, 1).toUpperCase();
  const isAdmin = s.role === 'admin';
  const roleEl = $('#uRole');
  roleEl.textContent = isAdmin ? '网站管理员' : '普通用户（只读）';
  roleEl.classList.toggle('is-admin', isAdmin);
  $('#uAdminBtn').style.display = isAdmin ? '' : 'none';

  const facts = [
    ['账号类型', s.builtin ? '内置管理员' : '注册用户'],
    ['权限', isAdmin ? '可编辑网站全部功能与界面' : '只读浏览（无编辑权限）'],
    ['登录时间', s.ts ? new Date(s.ts).toLocaleString('zh-CN') : '—']
  ];
  $('#uFacts').innerHTML = facts.map(f =>
    `<div class="fact-row"><span class="fact-k">${f[0]}</span><span class="fact-v">${f[1]}</span></div>`).join('');

  /* ---------- 退出 ---------- */
  $('#uLogout').addEventListener('click', () => {
    A.logout();
    location.replace('login.html');
  });

  /* ---------- 建议窗口 ---------- */
  const sugMsg = $('#sugMsg');
  const sugSubmit = $('#sugSubmit');
  $('#sugForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = $('#sugBody').value;
    sugMsg.textContent = ''; sugMsg.className = 'auth-msg';
    sugSubmit.disabled = true; sugSubmit.textContent = '提交中…';
    try {
      A.addSuggestion(body);
      $('#sugBody').value = '';
      sugMsg.textContent = '建议已提交，感谢你的反馈！';
      sugMsg.classList.add('ok');
      renderSent();
    } catch (err) {
      sugMsg.textContent = err.message;
      sugMsg.classList.add('err');
    }
    sugSubmit.disabled = false; sugSubmit.textContent = '提交建议';
  });

  /* ---------- 查看我已提交的建议（仅本人可见） ---------- */
  function renderSent() {
    const box = $('#uSent');
    const all = A.getSuggestions().filter(x => x.user === s.user);
    if (!all.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="u-sent-title" style="font-size:13px;color:var(--muted);margin-bottom:8px">我提交的建议</div>' +
      all.map(x => `<div class="us-item"><div class="us-time">${new Date(x.ts).toLocaleString('zh-CN')}</div>${escapeHtml(x.body)}</div>`).join('');
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  renderSent();
})();
