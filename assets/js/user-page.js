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

  /* ---------- 建议窗口（评控 + 邮件直达 253324704@qq.com） ---------- */
  const sugMsg = $('#sugMsg');
  const sugSend = $('#sugSend');
  const sugSubmit = $('#sugSubmit');
  $('#sugForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = $('#sugBody').value;
    sugMsg.textContent = ''; sugMsg.className = 'auth-msg';
    sugSend.style.display = 'none';
    sugSubmit.disabled = true; sugSubmit.textContent = '提交中…';
    try {
      A.addSuggestion(body);          // 内置恶意词/XSS/注入评控，命中直接抛错
      $('#sugBody').value = '';
      sugMsg.textContent = '建议已通过内容安全审核，已保存到站内。';
      sugMsg.classList.add('ok');
      sugSend.style.display = '';      // 显示「发送至邮箱」按钮
      renderSent();
    } catch (err) {
      sugMsg.textContent = err.message; // 评控/权限失败时展示原因
      sugMsg.classList.add('err');
    }
    sugSubmit.disabled = false; sugSubmit.textContent = '提交建议';
  });

  /* 把刚才通过审核的那条建议，用 mailto 预填草稿发送到管理员邮箱 */
  sugSend.addEventListener('click', (e) => {
    e.preventDefault();
    const sent = A.getSuggestions().filter(x => x.user === s.user);
    if (!sent.length) return;
    const latest = sent[0];
    const url = A.suggestionMailto(latest.user, latest.body);
    sugSend.href = url;          // 同步按钮 href，方便直接点
    location.href = url;         // 触发打开默认邮箱客户端 / 网页邮箱
  });
  /* 默认收件邮箱文案（与 auth.js 单一来源一致） */
  if (A.SUGGESTION_NOTIFY_EMAIL && $('#sugMail')) {
    $('#sugMail').textContent = A.SUGGESTION_NOTIFY_EMAIL;
    sugSend.textContent = '发送至 ' + A.SUGGESTION_NOTIFY_EMAIL + '（邮箱预填）';
  }

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
