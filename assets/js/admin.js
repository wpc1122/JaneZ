/* ============================================================
 *  张靓颖 Jane Zhang · 官方资料站 — 管理端逻辑
 *  管理员（glc）可编辑内容、调整界面、管理账号、导出/导入。
 * ============================================================ */
(function () {
  'use strict';
  const A = window.JANEZ_AUTH;
  const D = window.JANEZ_DATA;
  const $ = s => document.querySelector(s);

  /* 守卫：账号层 / 数据桥未加载成功时回到登录页，避免后续取 session 抛错 */
  if (!A || typeof A.currentSession !== 'function') { location.replace('login.html'); return; }

  /* ---------- 鉴权守卫：仅管理员可访问 ---------- */
  const sess = A.currentSession();
  if (!sess || sess.role !== 'admin') {
    location.replace('login.html');
    return;
  }
  $('#admWho').textContent = sess.user + (sess.builtin ? '（内置）' : '');

  /* ---------- Toast ---------- */
  let toastT;
  function toast(msg, ok) {
    const el = $('#admToast');
    el.textContent = msg;
    el.className = 'adm-toast show ' + (ok ? 'ok' : 'err');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- 角色切换 ---------- */
  $('#admRoles').addEventListener('click', e => {
    const r = e.target.closest('.adm-role');
    if (!r) return;
    document.querySelectorAll('.adm-role').forEach(x => x.classList.toggle('active', x === r));
    document.querySelectorAll('.adm-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + r.dataset.r));
    if (r.dataset.r === 'content') fillContent();
    if (r.dataset.r === 'accounts') fillUsers();
    if (r.dataset.r === 'suggestions') fillSuggestions();
  });

  /* ---------- 界面设置面板 ---------- */
  const SECTION_DEFS = [
    ['news', '最新动态'], ['profile', '个人档案'], ['journey', '星路历程'],
    ['music', '音乐作品'], ['tour', '巡回演唱会'], ['awards', '荣誉记录'],
    ['screen', '影像与舞台'], ['gallery', '光影瞬间'], ['contact', '聆听与关注']
  ];

  function loadUiControls() {
    const ui = D.getUiMerged();
    $('#uiTheme').value = ui.theme || '';
    $('#uiAccent').value = ui.accent || '#9c8bf5';
    $('#uiAccentHex').textContent = ui.accent || '#9c8bf5';
    $('#uiFont').value = ui.fontScale || 100;
    $('#uiFontVal').textContent = (ui.fontScale || 100) + '%';
    $('#txtHeroQuote').value = (ui.texts && ui.texts.heroQuote) || '';
    $('#txtNewsDesc').value = (ui.texts && ui.texts.newsDesc) || '';
    $('#txtMusicDesc').value = (ui.texts && ui.texts.musicDesc) || '';
    // 板块显隐
    $('#uiSections').innerHTML = SECTION_DEFS.map(([id, name]) => `
      <div class="adm-row">
        <label>${name}</label>
        <span class="adm-toggle"><input type="checkbox" data-sec="${id}" ${ (ui.visibleSections && ui.visibleSections[id] === false) ? '' : 'checked' }><span class="tk"></span></span>
      </div>`).join('');
  }

  function collectUi() {
    const vis = {};
    document.querySelectorAll('#uiSections input[data-sec]').forEach(cb => { vis[cb.dataset.sec] = cb.checked; });
    return {
      theme: $('#uiTheme').value || null,
      accent: $('#uiAccent').value || '',
      fontScale: Number($('#uiFont').value),
      visibleSections: vis,
      texts: {
        heroQuote: $('#txtHeroQuote').value,
        newsDesc: $('#txtNewsDesc').value,
        musicDesc: $('#txtMusicDesc').value
      }
    };
  }

  function applyUiLocal(ui) {
    const root = document.documentElement;
    if (ui.theme) root.setAttribute('data-theme', ui.theme); else root.removeAttribute('data-theme');
    if (ui.accent) root.style.setProperty('--accent', ui.accent); else root.style.removeProperty('--accent');
    if (ui.fontScale && ui.fontScale !== 100) root.style.fontSize = (16 * ui.fontScale / 100) + 'px'; else root.style.removeProperty('font-size');
    // 主站板块显隐即时预览（本页不渲染主站，仅在主站生效；此处保存即可）
  }

  $('#uiAccent').addEventListener('input', e => $('#uiAccentHex').textContent = e.target.value);
  $('#uiFont').addEventListener('input', e => $('#uiFontVal').textContent = e.target.value + '%');
  $('#uiApply').addEventListener('click', () => {
    const ui = collectUi();
    A.saveUi(ui);
    applyUiLocal(ui);
    toast('界面设置已保存，主站刷新后生效', true);
  });
  $('#uiReset').addEventListener('click', () => {
    A.saveUi({});
    loadUiControls();
    applyUiLocal(D.getUiMerged());
    toast('已恢复默认界面设置', true);
  });
  $('#uiPreview').addEventListener('click', () => { A.saveUi(collectUi()); location.replace('index.html'); });

  /* ---------- 内容编辑面板 ---------- */
  function fillContent() {
    const c = A.getContent();
    $('#contentJson').value = Object.keys(c).length ? JSON.stringify(c, null, 2) : '';
    if (!Object.keys(c).length) {
      // 给出可编辑骨架提示
      const keys = ['NEWS','PROFILE','TIMELINE','ALBUMS','OSTS','GLOBAL_SONGS','TOURS','AWARDS','SCREENS','VARIETY','GALLERY','PLATFORMS'];
      const skeleton = {};
      skeleton['NEWS'] = c.NEWS || '（留空使用内置；要修改请粘贴完整数组）';
      $('#contentJson').value = JSON.stringify(skeleton, null, 2);
    }
  }
  $('#contentValidate').addEventListener('click', () => {
    try { JSON.parse($('#contentJson').value || '{}'); toast('JSON 语法正确', true); }
    catch (e) { toast('JSON 错误：' + e.message, false); }
  });
  $('#contentSave').addEventListener('click', () => {
    try { const c = JSON.parse($('#contentJson').value || '{}'); A.saveContent(c); toast('内容已保存，主站刷新后采用', true); }
    catch (e) { toast('保存失败：' + e.message, false); }
  });
  $('#contentReset').addEventListener('click', () => {
    if (!confirm('确定清空所有内容覆盖、恢复内置数据？')) return;
    A.resetContent(); fillContent(); toast('已恢复默认内容', true);
  });
  $('#contentExport').addEventListener('click', () => { D.exportContentOnly(); toast('已导出内容 JSON', true); });
  $('#contentImport').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { D.importContent(rd.result); fillContent(); toast('内容已导入', true); } catch (er) { toast('导入失败：' + er.message, false); } };
    rd.readAsText(f); e.target.value = '';
  });

  /* ---------- 账号管理面板 ---------- */
  function fillUsers() {
    const users = A.getUsers();
    const list = $('#userList');
    if (!users.length) { list.innerHTML = '<p class="adm-note">暂无注册用户。内置管理员 glc 始终存在。</p>'; return; }
    list.innerHTML = users.map(u => `
      <div class="adm-user-row" data-user="${u.user}">
        <span class="u-name">${escapeHtml(u.user)}</span>
        <span class="u-role">${u.role === 'admin' ? '<span class="adm-badge b">管理员</span>' : '<span class="adm-badge">用户</span>'}</span>
        <button class="btn sm danger" data-del="${u.user}">删除</button>
      </div>`).join('');
    list.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      if (!confirm(`确认删除用户「${b.dataset.del}」？`)) return;
      A.deleteUser(b.dataset.del); fillUsers(); toast('用户已删除', true);
    }));
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  $('#siteExport').addEventListener('click', () => {
    const text = D.exportAll();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'janez-site-backup.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    toast('已导出全站数据（内容 + 界面设置）', true);
  });
  $('#siteImport').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { D.importAll(rd.result); location.reload(); toast('导入成功', true); } catch (er) { toast('导入失败：' + er.message, false); } };
    rd.readAsText(f); e.target.value = '';
  });

  /* ---------- 用户建议面板 ---------- */
  function fillSuggestions() {
    const list = A.getSuggestions();
    const box = $('#sugList');
    if (A.SUGGESTION_NOTIFY_EMAIL && $('#admSugMail')) $('#admSugMail').textContent = A.SUGGESTION_NOTIFY_EMAIL;
    if (!list.length) { box.innerHTML = '<div class="adm-sug-empty">暂无用户建议。</div>'; return; }
    box.innerHTML = list.map(x => `
      <div class="adm-sug-item" data-id="${x.id}">
        <div class="adm-sug-meta">
          <span class="adm-sug-user">${escapeHtml(x.user)}</span>
          <span>${new Date(x.ts).toLocaleString('zh-CN')}</span>
        </div>
        <div class="adm-sug-body">${escapeHtml(x.body)}</div>
        <div class="adm-sug-actions">
          <a class="btn sm" href="${escapeAttr(A.suggestionMailto(x.user, x.body))}">发该条</a>
          <button class="btn sm danger" data-del-sug="${x.id}">删除</button>
        </div>
      </div>`).join('');
    box.querySelectorAll('[data-del-sug]').forEach(b => b.addEventListener('click', () => {
      if (!confirm('确认删除这条建议？')) return;
      A.deleteSuggestion(b.dataset.delSug); fillSuggestions(); toast('该条建议已删除', true);
    }));
  }
  function escapeAttr(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  $('#sugExportMail').addEventListener('click', () => {
    const list = A.getSuggestions();
    if (!list.length) { toast('暂无建议可发送', false); return; }
    location.href = A.allSuggestionsMailto(list);
    toast('已预填全部建议的邮件草稿，请在邮箱确认发送', true);
  });
  $('#sugClear').addEventListener('click', () => {
    if (!confirm('确认清空全部用户建议？此操作不可恢复。')) return;
    A.clearSuggestions(); fillSuggestions(); toast('建议已全部清空', true);
  });

  /* ---------- 退出 ---------- */
  $('#admLogout').addEventListener('click', () => { (A.logout || A.setSession.bind(A, null))(); location.replace('login.html'); });

  /* ---------- 启动 ---------- */
  loadUiControls();
  applyUiLocal(D.getUiMerged());
})();
