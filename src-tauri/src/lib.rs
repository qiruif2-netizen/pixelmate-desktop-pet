use serde::{Deserialize, Serialize};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChatRequest {
    base_url: String,
    api_key: String,
    model: String,
    messages: Vec<ChatMessage>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ProviderRequest<'a> {
    model: &'a str,
    messages: &'a [ChatMessage],
    stream: bool,
}

#[derive(Deserialize)]
struct ProviderResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ProviderMessage,
}

#[derive(Deserialize)]
struct ProviderMessage {
    content: Option<String>,
}

fn chat_url(base_url: &str) -> String {
    let trimmed = base_url.trim_end_matches('/');
    if trimmed.ends_with("/chat/completions") {
        trimmed.to_string()
    } else {
        format!("{trimmed}/chat/completions")
    }
}

#[tauri::command]
async fn chat_completion(request: ChatRequest) -> Result<String, String> {
    if request.base_url.trim().is_empty()
        || request.api_key.trim().is_empty()
        || request.model.trim().is_empty()
    {
        return Err("API 地址、API Key 和模型名称不能为空".into());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|error| format!("无法创建网络请求：{error}"))?;

    let response = client
        .post(chat_url(&request.base_url))
        .bearer_auth(&request.api_key)
        .json(&ProviderRequest {
            model: &request.model,
            messages: &request.messages,
            stream: false,
        })
        .send()
        .await
        .map_err(|error| format!("无法连接 AI 服务：{error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("无法读取 AI 响应：{error}"))?;

    if !status.is_success() {
        let short_body: String = body.chars().take(300).collect();
        return Err(format!("AI 服务返回 {status}：{short_body}"));
    }

    let parsed: ProviderResponse = serde_json::from_str(&body)
        .map_err(|_| "AI 服务返回了不兼容的数据格式".to_string())?;
    parsed
        .choices
        .into_iter()
        .next()
        .and_then(|choice| choice.message.content)
        .filter(|content| !content.trim().is_empty())
        .ok_or_else(|| "AI 服务返回内容为空".to_string())
}

#[tauri::command]
fn show_pet(app: tauri::AppHandle) -> Result<(), String> {
    let pet = app
        .get_webview_window("pet")
        .ok_or_else(|| "找不到桌宠窗口".to_string())?;
    pet.set_always_on_top(true).map_err(|error| error.to_string())?;
    pet.show().map_err(|error| error.to_string())?;
    pet.set_focus().map_err(|error| error.to_string())?;
    if let Some(main) = app.get_webview_window("main") {
        main.hide().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_manager(app: tauri::AppHandle) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or_else(|| "找不到管理器窗口".to_string())?;
    main.show().map_err(|error| error.to_string())?;
    main.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

fn tray_icon() -> Image<'static> {
    let width = 24usize;
    let height = 24usize;
    let mut rgba = vec![0u8; width * height * 4];
    let orange = [231, 117, 61, 255];
    let ink = [44, 39, 34, 255];
    for y in 5..21 {
        for x in 4..20 {
            let rounded_corner = (x < 6 || x > 17) && (y < 7 || y > 18);
            if !rounded_corner {
                let offset = (y * width + x) * 4;
                rgba[offset..offset + 4].copy_from_slice(&orange);
            }
        }
    }
    for (x, y) in [(5usize, 3usize), (6, 4), (18, 3), (17, 4)] {
        let offset = (y * width + x) * 4;
        rgba[offset..offset + 4].copy_from_slice(&orange);
    }
    for (x, y) in [(9usize, 12usize), (15, 12), (12, 16)] {
        let offset = (y * width + x) * 4;
        rgba[offset..offset + 4].copy_from_slice(&ink);
    }
    Image::new_owned(rgba, width as u32, height as u32)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let manager_item = MenuItemBuilder::with_id("manager", "打开角色管理器").build(app)?;
            let pet_item = MenuItemBuilder::with_id("pet", "显示桌宠").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "退出 PixelMate").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&manager_item, &pet_item, &quit_item])
                .build()?;

            TrayIconBuilder::with_id("pixelmate-tray")
                .icon(tray_icon())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "manager" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "pet" => {
                        if let Some(window) = app.get_webview_window("pet") {
                            let _ = window.set_always_on_top(true);
                            let _ = window.show();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![chat_completion, show_pet, show_manager])
        .run(tauri::generate_context!())
        .expect("error while running PixelMate");
}

#[cfg(test)]
mod tests {
    use super::chat_url;

    #[test]
    fn appends_chat_completion_path() {
        assert_eq!(chat_url("https://example.com/v1"), "https://example.com/v1/chat/completions");
        assert_eq!(chat_url("https://example.com/v1/"), "https://example.com/v1/chat/completions");
    }

    #[test]
    fn preserves_full_chat_completion_url() {
        assert_eq!(
            chat_url("https://example.com/v1/chat/completions"),
            "https://example.com/v1/chat/completions"
        );
    }
}
