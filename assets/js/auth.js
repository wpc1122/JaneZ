/* ============================================================
 *  张靓颖 Jane Zhang · 官方资料站 — 账号与数据层（纯静态方案）
 *
 *  说明：本站为 GitHub Pages 纯静态站，无服务端后端，
 *  因此「账号体系 + 管理端」基于浏览器 localStorage 本地持久化，
 *  配合「内容/设置 JSON 导出与导入」实现跨设备迁移。
 *
 *  安全要点：
 *  - 所有口令在保存前用 Web Crypto 做 SHA-256 加盐哈希，绝不存明文；
 *  - 内置管理员 glc 仅在代码中保留其口令哈希，无明文可泄露；
 *  - 会话与内容/界面设置均存本机，刷新不失效。
 * ============================================================ */
(function () {
  'use strict';

  /* 内置管理员：用户名 + 口令哈希（sha256('janez|v1|glc|wang2000')），无明文 */
  const BUILTIN_ADMIN = {
    user: 'glc',
    hash: '590e206ccd33e938c19c2bed8988e2d27ed81c4eabae6362b363756828a3fc9f',
    role: 'admin',
    builtin: true
  };

  const SALT_PREFIX = 'janez|v1|';
  const USERS_KEY = 'janez_users';       // 注册用户（含口令哈希）
  const SESSION_KEY = 'janez_session';   // 当前会话
  const CONTENT_KEY = 'janez_content';   // 内容覆盖（管理端编辑）
  const THEME_KEY = 'janez_ui';          // 界面设置（主题/配色/字号/显隐/文案）

  /* ---------- 哈希（Web Crypto，非阻塞） ---------- */
  async function sha256(str) {
    if (!window.crypto || !crypto.subtle) throw new Error('当前环境不支持 Web Crypto，请在 HTTPS 或本地回环地址访问');
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const hashUser = (u, p) => sha256(SALT_PREFIX + u + '|' + p);

  /* ---------- 注册用户存取 ---------- */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveUsers(arr) {
    localStorage.setItem(USERS_KEY, JSON.stringify(arr));
  }

  /* ---------- 鉴权：登录校验 ---------- */
  async function verify(user, pw) {
    user = (user || '').trim();
    if (!user || !pw) return null;
    // 内置管理员
    if (user === BUILTIN_ADMIN.user) {
      return (await hashUser(user, pw)) === BUILTIN_ADMIN.hash
        ? { user, role: 'admin', builtin: true }
        : null;
    }
    const found = getUsers().find(u => u.user === user);
    if (!found) return null;
    if ((await hashUser(user, pw)) !== found.hash) return null;
    // 注册用户只有普通权限：无论记录中 role 为何，一律强制 user，
    // 只有内置 glc 才获得 admin（防止 localStorage 被篡改越权）
    return { user: found.user, role: 'user', builtin: false };
  }

  /* ---------- 注册 ---------- */
  async function register(user, pw) {
    user = (user || '').trim();
    if (!/^[A-Za-z0-9_\u4e00-\u9fa5]{2,20}$/.test(user))
      throw new Error('用户名需为 2–20 位：字母 / 数字 / 下划线 / 中文');
    if (String(pw).length < 6) throw new Error('口令长度至少 6 位');
    if (user === BUILTIN_ADMIN.user) throw new Error('该用户名不可用');
    const users = getUsers();
    if (users.some(u => u.user === user)) throw new Error('用户名已存在');
    const rec = { user, hash: await hashUser(user, pw), role: 'user', ts: Date.now() };
    users.push(rec); saveUsers(users);
    return rec.user;
  }

  /* ---------- 会话 ---------- */
  function currentSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  }
  function setSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }
  /* 退出：仅清除本机会话；内容与界面编辑保留（属站点本地数据） */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    return true;
  }
  function isAdmin() {
    const s = currentSession();
    return !!(s && s.role === 'admin');
  }

  /* ---------- 内容覆盖（管理端编辑的数据） ---------- */
  function getContent() {
    try { return JSON.parse(localStorage.getItem(CONTENT_KEY)) || {}; }
    catch (e) { return {}; }
  }
  /* 写操作统一加管理员守卫：普通用户 / 未登录一律拒绝，防越权 */
  function saveContent(c) {
    if (!isAdmin()) throw new Error('权限不足：仅网站管理员可编辑内容');
    localStorage.setItem(CONTENT_KEY, JSON.stringify(c));
  }
  function resetContent() {
    if (!isAdmin()) throw new Error('权限不足：仅网站管理员可编辑内容');
    localStorage.removeItem(CONTENT_KEY);
  }

  /* ---------- 界面设置 ---------- */
  function getUi() {
    try { return JSON.parse(localStorage.getItem(THEME_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveUi(o) {
    if (!isAdmin()) throw new Error('权限不足：仅网站管理员可修改界面设置');
    localStorage.setItem(THEME_KEY, JSON.stringify(o));
  }

  /* ---------- 注册用户管理（仅管理员） ---------- */
  function deleteUser(user) {
    user = (user || '').trim();
    if (!isAdmin()) return false;
    if (!user || user === BUILTIN_ADMIN.user) return false;
    saveUsers(getUsers().filter(u => u.user !== user));
    return true;
  }

  /* ---------- 用户建议（任何登录用户可提交，仅管理员可读取） ---------- */
  const SUGGESTIONS_KEY = 'janez_suggestions';
  function getSuggestions() {
    try { return JSON.parse(localStorage.getItem(SUGGESTIONS_KEY)) || []; }
    catch (e) { return []; }
  }
  function addSuggestion(body) {
    const s = currentSession();
    if (!s) throw new Error('请先登录后再提交建议');
    body = String(body || '').trim();
    if (body.length < 4) throw new Error('建议内容至少 4 个字');
    if (body.length > 500) throw new Error('建议内容过长（上限 500 字）');
    const list = getSuggestions();
    list.unshift({
      id: 'sg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      user: s.user, ts: Date.now(), body
    });
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(list.slice(0, 200)));
    return true;
  }
  function clearSuggestions() {
    if (!isAdmin()) throw new Error('权限不足：仅网站管理员可清空建议');
    localStorage.removeItem(SUGGESTIONS_KEY);
    return true;
  }

  window.JANEZ_AUTH = {
    verify, register,
    currentSession, setSession, logout, isAdmin,
    getContent, saveContent, resetContent,
    getUi, saveUi,
    getUsers, deleteUser,
    BUILTIN_ADMIN,
    USERS_KEY, SESSION_KEY, CONTENT_KEY, THEME_KEY, SUGGESTIONS_KEY,
    getSuggestions, addSuggestion, clearSuggestions
  };
})();
