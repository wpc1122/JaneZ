/* ============================================================
 *  张靓颖 Jane Zhang · 官方资料站 — 内容覆盖与界面设置桥接
 *  主页（main.js）在渲染时读取本模块合并后的数据与界面设置；
 *  管理端（admin.js）通过它写入编辑结果并即时预览。
 * ============================================================ */
(function () {
  'use strict';
  const A = window.JANEZ_AUTH;

  const merge = (target, src) => Object.assign(target, src);

  /* ---------- 组装最终渲染数据：内置数据 + 管理端覆盖 ---------- */
  function getMerged() {
    const base = {
      PROFILE, NEWS, TIMELINE, ALBUMS, OSTS, GLOBAL_SONGS,
      TOURS, AWARDS, SCREENS, VARIETY, GALLERY, PLATFORMS
    };
    const c = A ? A.getContent() : {};
    for (const k of Object.keys(base)) {
      if (c[k] !== undefined) base[k] = c[k];
    }
    // PROFILE 为对象，做字段级合并
    if (c.PROFILE && base.PROFILE) base.PROFILE = Object.assign(base.PROFILE, c.PROFILE);
    return base;
  }

  /* ---------- 界面设置（主题/配色/字号/板块显隐/文案） ---------- */
  const UI_DEFAULTS = {
    theme: null,          // 'dark' | 'light' | null(默认)
    accent: '',           // 主色（留空用默认）
    fontScale: 100,       // 字号百分比 80–130
    visibleSections: {},  // { news:true, gallery:false, ... }
    texts: {}             // { heroQuote:'', newsDesc:'', ... } 文案覆盖
  };
  function getUiMerged() {
    const o = A ? A.getUi() : {};
    return Object.assign({}, UI_DEFAULTS, o);
  }

  /* ---------- 导出/导入 完整内容 + 界面设置（JSON） ---------- */
  function exportAll() {
    const payload = {
      app: 'janez-site',
      version: 1,
      exportedAt: new Date().toISOString(),
      content: A ? A.getContent() : {},
      ui: A ? A.getUi() : {}
    };
    return JSON.stringify(payload, null, 2);
  }
  function importAll(jsonText) {
    const p = JSON.parse(jsonText);
    if (p && p.app === 'janez-site') {
      A.saveContent(p.content || {});
      A.saveUi(p.ui || {});
      return true;
    }
    throw new Error('文件格式不正确');
  }
  function exportContentOnly() {
    const c = A ? A.getContent() : {};
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'janez-content.json';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    return c;
  }
  function importContent(jsonText) {
    const c = JSON.parse(jsonText);
    if (c && typeof c === 'object') { A.saveContent(c); return c; }
    throw new Error('内容文件不正确');
  }

  window.JANEZ_DATA = {
    getMerged, getUiMerged,
    exportAll, importAll,
    exportContentOnly, importContent,
    UI_DEFAULTS
  };
})();
