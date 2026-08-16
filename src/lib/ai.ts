import { invoke } from "@tauri-apps/api/core";
import type { AiConfig, ChatMessage, PetProfile, PetStats } from "../types";

interface ChatRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
}

function chatUrl(baseUrl: string): string {
  const clean = baseUrl.replace(/\/+$/, "");
  return clean.endsWith("/chat/completions") ? clean : `${clean}/chat/completions`;
}

export function createSystemPrompt(profile: PetProfile, stats: PetStats, custom: string): string {
  const roles = {
    friend: "亲密朋友",
    girlfriend: "虚拟女友",
    boyfriend: "虚拟男友",
    study: "学习搭子",
    custom: profile.customRole || "虚拟伙伴",
  };
  return [
    custom,
    `你的名字是${profile.name}，身份是用户的${roles[profile.role]}。`,
    `用户希望被称为${profile.userName}。你的性格是：${profile.personality}`,
    `当前状态：亲密度${stats.intimacy}/100、心情${stats.mood}/100、活力${stats.energy}/100。`,
    "保持虚拟角色身份，表达温暖但不要制造依赖，不冒充真人或专业医疗人员。默认回复控制在80字以内。",
  ].join("\n");
}

export async function chatCompletion(
  config: AiConfig,
  profile: PetProfile,
  stats: PetStats,
  history: ChatMessage[],
): Promise<string> {
  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error("请先填写 API 地址、API Key 和模型名称");
  }

  const request: ChatRequest = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    messages: [
      { role: "system", content: createSystemPrompt(profile, stats, config.systemPrompt) },
      ...history.slice(-12).map(({ role, content }) => ({ role, content })),
    ],
  };

  if ("__TAURI_INTERNALS__" in window) {
    return invoke<string>("chat_completion", { request });
  }

  const response = await fetch(chatUrl(config.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model: config.model, messages: request.messages, stream: false }),
  });
  if (!response.ok) throw new Error(`API 请求失败：${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("API 返回内容为空或格式不兼容");
  return String(content);
}

export async function testAiConnection(config: AiConfig): Promise<string> {
  const response = await chatCompletion(
    config,
    { name: "PixelMate", userName: "用户", role: "friend", customRole: "", personality: "简洁", greeting: "" },
    { intimacy: 0, mood: 50, energy: 50, level: 1, experience: 0 },
    [{ id: "test", role: "user", content: "请只回复：连接成功", createdAt: Date.now() }],
  );
  return response;
}

