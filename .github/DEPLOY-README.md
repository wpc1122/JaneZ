# 方案 A 接入指南：源码私有 + 网站公开

> 本文件与 `.github/workflows/sync-to-pages.yml` 只存在于**私有仓**，
> 同步到公开仓时被 `--exclude='.github'` 排除，**不会泄露任何 secret 或部署细节**。

## 原理
```
[私有源仓 JaneZ-source]  --push-->  [Actions 自动同步]  --push-->  [公开仓 JaneZ]
   源码在这里(只有你能看)                                                    ↑ 已启用 Pages
                                                                            |
                                                                    https://wpc1122.github.io/JaneZ/
```
你平时像现在一样往**私有仓**提交；GitHub Actions 每次推送后自动把站点文件镜像到**公开仓**，
公开仓的 GitHub Pages 照常发布。改内容、加功能、改样式全部进私有仓即可，公开只看到成品。

## 一次性接入（约 5 分钟）
1. **建私有源仓库**
   - 到 GitHub 新建仓库 `JaneZ-source`，勾选 **Private**。
   - 把本地 `zhangliangying` 站点整个推上去：
     ```
     git remote add source https://github.com/你的账号/JaneZ-source.git
     git push source master:main
     ```
   - 之后在私有仓里改代码。

2. **建一个有写权限的 PAT，存进私有仓 secret**
   - GitHub → 头像 → Settings → Developer settings → Personal access tokens →
     新建 **Fine-grained PAT**，勾选仓库 `JaneZ`（公开仓），权限 `Contents: Read and write`。
   - 把生成的 token 存入私有仓：`Settings → Secrets and variables → Actions → New repository secret`
     - 名称：`SYNC_TOKEN`
     - 值：粘贴刚生成的 PAT

3. **公开仓保持现状**：`wpc1122/JaneZ` 已启用 GitHub Pages（`main` 根目录），无需改动。

4. **触发**：往私有仓推一次任意提交，`sync-to-pages.yml` 就会自动把最新站点同步到公开仓，
   Pages 几分钟内更新完毕。

## 日常
- 改内容 / 改代码 → 提交到**私有仓 main** → Actions 自动同步 → 公开网站更新。
- 想临时手动同步：在私有仓 `Actions` 页点 `Sync to Public Pages Repo` → `Run workflow`。

## 故障排查
- **同步被拒 (push rejected)**：公开仓领先了（别处直推过）。重跑 workflow 或先删公开仓最近提交。
- **SYNC_TOKEN 失效**：PAT 过期/被撤销 → 重新生成并更新私有仓 secret。
- **公开仓出现 .github**：不会发生，rsync 已排除；若误推过手动删掉。

## 备注
- 管理口令哈希（`janez|v1|glc|...`）等敏感信息随源码进**私有仓**，公开仓只拿成品，
  但注意公开仓的 JS 里仍会带这份内置哈希（这是静态站的固有限制，公开可查）。
  若连哈希都不想让公开看到，可把内置管理员逻辑从公开产物里剥离（需再改代码分层）。
