# macOS 环境配置

适用于 macOS 13 或更高版本，支持 Apple Silicon 与 Intel Mac。

## 1. 安装系统工具

仅构建桌面应用时，安装 Xcode Command Line Tools 即可：

```bash
xcode-select --install
```

安装完成后验证：

```bash
xcode-select -p
clang --version
```

## 2. 安装 Node.js、Git 和 Rust

如果已经安装 Homebrew：

```bash
brew install node git
```

安装 Rust：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

检查版本：

```bash
node --version
npm --version
rustc --version
cargo --version
git --version
```

## 3. 下载并启动

```bash
git clone https://github.com/qiruif2-netizen/pixelmate-desktop-pet.git
cd pixelmate-desktop-pet
npm ci
npm run tauri dev
```

完成依赖安装后，也可以给根目录的启动文件增加执行权限，之后直接双击启动：

```bash
chmod +x 启动桌面宠物.command
```

也可以使用项目脚本：

```bash
chmod +x scripts/start-macos.sh
./scripts/start-macos.sh
```

首次编译需要下载 Rust 依赖，时间取决于网络和电脑性能。

## 4. 构建 macOS 应用

```bash
npm run tauri build
```

构建结果通常位于：

```text
src-tauri/target/release/bundle/macos/
src-tauri/target/release/bundle/dmg/
```

当前电脑会默认构建自身架构：

- Apple Silicon：`aarch64-apple-darwin`
- Intel：`x86_64-apple-darwin`

## 5. 未签名版本说明

当前 Demo 没有 Apple Developer ID 签名和公证。源码本地运行适合开发测试；通过网络下载的未签名应用可能被 Gatekeeper 阻止。

只运行自己信任并核对过的源码。如果 Finder 阻止打开自己构建的应用，可以在 Finder 中右键应用并选择“打开”，不要全局关闭 Gatekeeper。

## 6. 当前 macOS 状态

- 透明窗口配置已启用。
- 托盘、窗口拖动、屏幕边缘移动使用 Tauri 跨平台 API。
- 最低系统版本配置为 macOS 13。
- GitHub Actions 会构建 Apple Silicon 和 Intel 两个版本。
- 正式对外发布前仍需要真实 Mac 进行交互和多显示器验收。
