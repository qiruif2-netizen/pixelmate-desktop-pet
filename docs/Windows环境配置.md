# Windows 环境配置

适用于 Windows 10/11 64 位。

## 1. 安装基础工具

1. 安装 [Git](https://git-scm.com/download/win)。
2. 安装 Node.js LTS，推荐 Node.js 22。
3. 安装 Microsoft Visual Studio Build Tools。
4. 勾选“使用 C++ 的桌面开发”。
5. 确认同时安装 MSVC x64/x86 Build Tools 和 Windows 10/11 SDK。
6. 安装 [Rustup](https://rustup.rs/)，选择 stable MSVC 工具链。
7. 确认 Microsoft Edge WebView2 Runtime 已安装。

重新打开 PowerShell，检查：

```powershell
node --version
npm --version
rustc --version
cargo --version
git --version
```

如果 Rust 不是 MSVC 工具链：

```powershell
rustup default stable-msvc
```

## 2. 下载并启动

```powershell
git clone https://github.com/qiruif2-netizen/pixelmate-desktop-pet.git
cd pixelmate
npm ci
npm run tauri dev
```

也可以直接双击项目根目录的：

```text
启动桌面宠物.cmd
```

## 3. 构建 Windows 安装包

```powershell
npm run tauri build
```

产物通常位于：

```text
src-tauri\target\release\bundle\
```

## 4. 常见问题

### `link.exe` 或 `msvcrt.lib` 找不到

打开 Visual Studio Installer，修改 Build Tools 或 Visual Studio 安装，确认勾选：

- 使用 C++ 的桌面开发
- MSVC x64/x86 生成工具
- Windows 10 SDK 或 Windows 11 SDK

完成后重新启动终端。只有 SDK 文件夹但缺少 `Lib` 目录中的 `.lib` 文件也属于安装不完整，需要执行“修复”。

### 找不到 `cargo`

重新打开终端，确认 `%USERPROFILE%\.cargo\bin` 已加入 PATH。

### 页面空白

确认 WebView2 Runtime 已安装，并查看启动终端中的错误信息。

### 端口 1420 被占用

先退出系统托盘中的旧 PixelMate，并关闭之前运行的 Vite 终端，再重新启动。

## 5. 未签名版本说明

当前 Demo 没有 Windows 代码签名，可能显示 SmartScreen 提示。请只构建和运行自己信任并检查过的源码。
