# Windows development environment

The transparent desktop pet requires the complete Tauri build environment:

1. Install Rust with rustup: https://rustup.rs/
2. Install Visual Studio 2022 Build Tools: https://aka.ms/vs/17/release/vs_BuildTools.exe
3. In the installer, select **Desktop development with C++** and a Windows 10/11 SDK.
4. Restart the terminal and verify `rustc --version` and `cargo --version`.
5. Double-click `启动桌面宠物.cmd`. The launcher automatically loads the C++
   developer environment from `C:\BuildTools` or the default Visual Studio 2022
   Build Tools location before starting Tauri.

If you prefer the command line, first open an **x64 Native Tools Command Prompt
for VS 2022**, then run `npm run tauri dev` in the project directory.

The browser preview cannot create an operating-system transparent window.
