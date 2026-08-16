# GitHub 发布说明

## 首次上传

1. 在 GitHub 创建一个空仓库，例如 `pixelmate-desktop-pet`。
2. 不要在网页端额外生成 README、许可证或 `.gitignore`。
3. 在本项目目录初始化并上传：

```bash
git init
git branch -M main
git add .
git commit -m "Initial open-source PixelMate demo"
git remote add origin https://github.com/<账号>/<仓库>.git
git push -u origin main
```

不要把 GitHub 密码、Personal Access Token、AI API Key 或签名证书提交到仓库。

## 自动构建

上传到 `main` 后，GitHub Actions 会运行三组构建：

- Windows x64
- macOS Apple Silicon
- macOS Intel

打开仓库的 Actions → Build desktop apps 查看结果。三组全部变绿后，才能把 macOS 和 Windows 标记为已通过云端构建验证。

构建产物会保存在对应工作流运行的 Artifacts 中。这些产物没有代码签名，只用于开发测试。

## 推荐发布流程

1. 更新 `package.json` 和 `src-tauri/tauri.conf.json` 中的版本号。
2. 运行 `npm test` 和 `npm run build`。
3. 提交并推送代码。
4. 确认 GitHub Actions 三个平台全部通过。
5. 创建 GitHub Release，说明这是未签名测试版。
6. 正式商业分发前配置 Windows 代码签名与 Apple Developer ID 签名、公证。

