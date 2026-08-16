<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { Bone, Gift, Heart, LoaderCircle, MessageCircle as MessageCircleIcon, Send, Sparkles } from "lucide-vue-next";
import { appState, interact } from "../lib/state";
import { chatCompletion } from "../lib/ai";
import type { ChatMessage, CompanionRole } from "../types";

const draft = ref("");
const sending = ref(false);
const chatBody = ref<HTMLElement>();
const notice = ref("");

const roleOptions: Array<{ value: CompanionRole; label: string }> = [
  { value: "friend", label: "亲密朋友" },
  { value: "girlfriend", label: "虚拟女友" },
  { value: "boyfriend", label: "虚拟男友" },
  { value: "study", label: "学习搭子" },
  { value: "custom", label: "自定义" },
];

const progress = computed(() => Math.min(100, Math.round((appState.stats.experience / (appState.stats.level * 100)) * 100)));

function reaction(kind: "pet" | "feed" | "gift") {
  interact(kind);
  notice.value = {
    pet: `${appState.profile.name} 开心地蹭了蹭你的手。`,
    feed: `${appState.profile.name} 恢复了一些活力。`,
    gift: `${appState.profile.name} 很喜欢这份礼物！`,
  }[kind];
  window.setTimeout(() => (notice.value = ""), 2600);
}

async function send() {
  const content = draft.value.trim();
  if (!content || sending.value) return;
  const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content, createdAt: Date.now() };
  appState.messages.push(userMessage);
  draft.value = "";
  sending.value = true;
  await scrollBottom();
  try {
    const reply = await chatCompletion(appState.ai, appState.profile, appState.stats, appState.messages);
    appState.messages.push({ id: crypto.randomUUID(), role: "assistant", content: reply, createdAt: Date.now() });
    interact("pet");
  } catch (error) {
    appState.messages.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: error instanceof Error ? error.message : "连接服务时出现问题，请检查配置。",
      createdAt: Date.now(),
    });
  } finally {
    sending.value = false;
    await scrollBottom();
  }
}

async function scrollBottom() {
  await nextTick();
  chatBody.value?.scrollTo({ top: chatBody.value.scrollHeight, behavior: "smooth" });
}
</script>

<template>
  <section class="companion-layout">
    <div class="left-stack">
      <article class="card profile-editor">
        <div class="card-heading"><div><span class="eyebrow">IDENTITY</span><h3>角色身份</h3></div><Heart :size="20" /></div>
        <div class="two-fields">
          <label>角色名字<input v-model.trim="appState.profile.name" maxlength="16" /></label>
          <label>对你的称呼<input v-model.trim="appState.profile.userName" maxlength="16" /></label>
        </div>
        <label>陪伴身份<select v-model="appState.profile.role"><option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option></select></label>
        <label v-if="appState.profile.role === 'custom'">自定义身份<input v-model="appState.profile.customRole" placeholder="例如：冒险伙伴" /></label>
        <label>性格设定<textarea v-model="appState.profile.personality" rows="3"></textarea></label>
        <label>见面问候<input v-model="appState.profile.greeting" /></label>
      </article>

      <article class="card growth-card">
        <div class="card-heading"><div><span class="eyebrow">GROWTH</span><h3>陪伴养成</h3></div><span class="level-badge">Lv. {{ appState.stats.level }}</span></div>
        <div class="growth-pet">
          <img v-if="appState.appearance.image" :src="appState.appearance.image" alt="桌宠" />
          <div v-else class="mini-placeholder">?</div>
          <div><strong>{{ appState.profile.name }}</strong><span>{{ notice || '正在安静地陪着你。' }}</span></div>
        </div>
        <div class="meter-list">
          <label><span>亲密度</span><i><b :style="{ width: `${appState.stats.intimacy}%` }"></b></i><strong>{{ appState.stats.intimacy }}</strong></label>
          <label><span>心情</span><i><b :style="{ width: `${appState.stats.mood}%` }"></b></i><strong>{{ appState.stats.mood }}</strong></label>
          <label><span>活力</span><i><b :style="{ width: `${appState.stats.energy}%` }"></b></i><strong>{{ appState.stats.energy }}</strong></label>
          <label><span>经验</span><i><b :style="{ width: `${progress}%` }"></b></i><strong>{{ progress }}%</strong></label>
        </div>
        <div class="interaction-row">
          <button @click="reaction('pet')"><Heart :size="17" /> 抚摸</button>
          <button @click="reaction('feed')"><Bone :size="17" /> 喂食</button>
          <button @click="reaction('gift')"><Gift :size="17" /> 礼物</button>
        </div>
      </article>
    </div>

    <article class="card chat-panel">
      <div class="chat-header">
        <div class="avatar"><img v-if="appState.appearance.image" :src="appState.appearance.image" alt="" /><Sparkles v-else :size="20" /></div>
        <div><strong>{{ appState.profile.name }}</strong><span><i></i>{{ appState.ai.apiKey ? 'AI 服务已连接' : '等待配置 AI 服务' }}</span></div>
      </div>
      <div ref="chatBody" class="chat-body">
        <div v-if="!appState.messages.length" class="chat-empty">
          <MessageCircleIcon />
          <h3>开始一段新的陪伴</h3>
          <p>配置自己的 AI API 后，就可以和 {{ appState.profile.name }} 聊天。</p>
          <div><button @click="draft = '今天有点累，可以陪我聊聊吗？'">今天有点累</button><button @click="draft = '给我一点开始工作的动力吧'">一起开始工作</button></div>
        </div>
        <div v-for="message in appState.messages" :key="message.id" class="message" :class="message.role">
          <span>{{ message.role === 'assistant' ? appState.profile.name : appState.profile.userName }}</span>
          <p>{{ message.content }}</p>
        </div>
        <div v-if="sending" class="message assistant"><span>{{ appState.profile.name }}</span><p class="typing"><i></i><i></i><i></i></p></div>
      </div>
      <form class="chat-input" @submit.prevent="send">
        <textarea v-model="draft" rows="2" placeholder="说点什么…" @keydown.enter.exact.prevent="send"></textarea>
        <button :disabled="!draft.trim() || sending" aria-label="发送"><LoaderCircle v-if="sending" :size="18" class="spinning" /><Send v-else :size="18" /></button>
      </form>
      <p class="chat-disclaimer">AI 可能出错；重要信息请独立核实。对话将发送至你配置的服务商。</p>
    </article>
  </section>
</template>
