# PixelMate 桌面宠物

PixelMate 是一个基于 Vue 3、Tauri 2 和 Rust 的开源桌面宠物 Demo，面向 Windows 与 macOS。宠物显示在无边框透明窗口中，可以待机、眨眼、整理毛发、行走、睡觉，并响应抚摸和喂食。

> 当前为开发测试版。源码可以自由下载和本地构建，但安装包尚未进行 Windows 代码签名或 Apple Developer ID 签名、公证。

## 支持状态

| 平台 | 源码运行 | 本地构建 | 当前验证状态 |
| --- | --- | --- | --- |
| Windows 10/11 x64 | 支持 | 支持 | 前端构建与自动测试已通过 |
| macOS 13+ Apple Silicon | 支持 | 支持 | GitHub macOS Runner 构建通过，已生成 APP 和 DMG |
| macOS 13+ Intel | 支持 | 支持 | GitHub macOS Runner 构建通过，已生成 APP 和 DMG |

Tauri 本身支持 Windows 和 macOS，但 macOS 应用必须在 Mac 或 GitHub 的 macOS Runner 上构建，不能直接在 Windows 电脑上生成 macOS 应用。

## 当前功能

- 4 种猫、3 种狗、2 种鸟和 1 个原创机器人
- 动物逐帧动作：待机、眨眼、观察、整理毛发、行走或跳跃、抚摸、睡觉
- 透明置顶桌宠窗口，支持拖动、自动移动、到屏幕边缘转向
- 食物背包、喂食动画、抚摸、礼物、心情、活力、亲密度和等级
- 朋友、虚拟男友、虚拟女友、学习搭子和自定义身份
- 用户自行配置 OpenAI Chat Completions 兼容 API
- 用户自行配置天气服务，支持本机时间和上下班提醒
- 本地音乐播放
- 用户主动授权的开机自启；登录系统后直接显示桌宠
- 配置和聊天记录默认保存在用户本机

## 最快开始

### Windows

先完成 [Windows 环境配置](docs/Windows环境配置.md)，然后在项目目录双击：

```text
启动桌面宠物.cmd
```

也可以在 PowerShell 中运行：

```powershell
npm install
npm run tauri dev
```

### macOS

先完成 [macOS 环境配置](docs/macOS环境配置.md)，然后在终端运行：

```bash
git clone https://github.com/qiruif2-netizen/pixelmate-desktop-pet.git
cd pixelmate-desktop-pet
chmod +x scripts/start-macos.sh
./scripts/start-macos.sh
```

也可以给项目根目录中的 `启动桌面宠物.command` 执行权限，然后双击启动：

```bash
chmod +x 启动桌面宠物.command
```

## 构建安装包

在目标操作系统中运行：

```bash
npm ci
npm run tauri build
```

- Windows 产物：`src-tauri/target/release/bundle/`
- macOS 产物：`src-tauri/target/release/bundle/dmg/` 和 `macos/`

GitHub 工作流会分别使用 Windows、Apple Silicon macOS 和 Intel macOS 环境构建。未签名产物只适合开发测试。

## 第三方 API 声明

PixelMate 不提供共享 API Key，也不包含 AI、天气、语音或音乐服务额度。需要联网的功能由用户自行选择服务商并填写自己的 API 地址、Key 和模型名称。

- API Key 不会发送到 PixelMate 项目方服务器。
- 对话内容只会发送到用户主动配置的 AI 服务商。
- 天气请求只会发送到用户配置的天气服务商。
- 本地音乐不会上传到服务器。
- 当前 Demo 使用本机 WebView 存储配置。不要在公共电脑保存生产环境密钥。

详细说明参见 [隐私说明](PRIVACY.md) 和 [使用说明](docs/使用说明.md)。

## 测试

```bash
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

## 项目结构

```text
src/                    Vue 界面、状态和桌宠行为
src/assets/pets/        内置原创宠物和动作精灵图
src/components/         图鉴、陪伴和服务配置
src/lib/                状态和 AI 服务
src-tauri/              Tauri/Rust 桌面端
docs/                   使用与双平台环境手册
scripts/                平台启动脚本
.github/workflows/      GitHub 自动测试和双平台构建
```

## 已知限制

- macOS 透明窗口需要 Tauri 的 `macos-private-api`，因此当前方案不适合提交 Mac App Store，但可用于 GitHub 开源分发。
- 未签名安装包可能触发 Windows SmartScreen 或 macOS Gatekeeper。
- Windows 和 macOS 必须分别在对应系统上构建。

## 版权与许可证

代码采用 [MIT License](LICENSE)。仓库只分发项目原创宠物素材。请勿把没有明确授权的动漫、影视、游戏或品牌角色加入公开发行版本。
