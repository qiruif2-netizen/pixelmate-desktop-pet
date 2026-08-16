<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Bot,
  CloudSun,
  Github,
  Heart,
  Home,
  MessageCircle,
  Music2,
  PawPrint,
  Settings,
  Sparkles,
} from "lucide-vue-next";
import PetLibrary from "./components/PetLibrary.vue";
import CompanionPanel from "./components/CompanionPanel.vue";
import ServicePanel from "./components/ServicePanel.vue";
import { appState } from "./lib/state";

type Section = "home" | "library" | "companion" | "services";
const section = ref<Section>("home");

const nav = [
  { id: "home" as const, label: "概览", icon: Home },
  { id: "library" as const, label: "宠物图鉴", icon: PawPrint },
  { id: "companion" as const, label: "陪伴空间", icon: Heart },
  { id: "services" as const, label: "服务配置", icon: Settings },
];

const progress = computed(() => Math.min(100, Math.round((appState.stats.experience / (appState.stats.level * 100)) * 100)));

function go(target: Section) {
  section.value = target;
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark"><Sparkles :size="20" /></div>
        <div><strong>PixelMate</strong><span>像素陪伴实验室</span></div>
      </div>

      <nav class="nav-list" aria-label="主导航">
        <button v-for="item in nav" :key="item.id" :class="{ active: section === item.id }" @click="go(item.id)">
          <component :is="item.icon" :size="19" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-card">
        <span class="eyebrow">LOCAL FIRST</span>
        <p>图片、角色数据和服务密钥默认仅保存在本机。</p>
        <a href="https://github.com" target="_blank" rel="noreferrer"><Github :size="15" /> 开源计划</a>
      </div>
      <p class="version">Demo v0.1.0 · Windows / macOS</p>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div>
          <span class="eyebrow">YOUR DESKTOP COMPANION</span>
          <h1 v-if="section === 'home'">选一位伙伴，让桌面有温度。</h1>
          <h1 v-else-if="section === 'library'">宠物图鉴</h1>
          <h1 v-else-if="section === 'companion'">陪伴空间</h1>
          <h1 v-else>服务配置</h1>
        </div>
        <div class="privacy-pill"><span></span> 本地运行</div>
      </header>

      <section v-if="section === 'home'" class="dashboard">
        <div class="hero-card">
          <div class="hero-copy">
            <span class="soft-badge"><Sparkles :size="14" /> 开源 Demo</span>
            <h2>你好，{{ appState.profile.userName }}。</h2>
            <p>{{ appState.profile.name }} 今天也在桌面等你。内置宠物无需上传图片，选择后即可开始陪伴。</p>
            <div class="hero-actions">
              <button class="primary" @click="go('library')"><PawPrint :size="18" /> 挑选桌面伙伴</button>
              <button class="secondary" @click="go('companion')"><MessageCircle :size="18" /> 打开陪伴空间</button>
            </div>
          </div>
          <div class="hero-pet">
            <div class="sun-disc"></div>
            <img v-if="appState.appearance.image" :src="appState.appearance.image" alt="当前桌宠" />
            <div v-else class="placeholder-pet"><span>+</span><small>等待你的图片</small></div>
            <div class="speech-chip">{{ appState.profile.greeting }}</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <article class="card companion-card">
            <div class="card-heading"><div><span class="eyebrow">COMPANION</span><h3>{{ appState.profile.name }}</h3></div><Heart :size="21" /></div>
            <div class="stats-row">
              <div><strong>{{ appState.stats.intimacy }}</strong><span>亲密度</span></div>
              <div><strong>{{ appState.stats.mood }}</strong><span>心情</span></div>
              <div><strong>{{ appState.stats.energy }}</strong><span>活力</span></div>
            </div>
            <div class="level-line"><span>Lv. {{ appState.stats.level }}</span><div><i :style="{ width: `${progress}%` }"></i></div><span>{{ progress }}%</span></div>
          </article>

          <article class="card quick-card">
            <div class="card-heading"><div><span class="eyebrow">QUICK START</span><h3>三步开始陪伴</h3></div><Sparkles :size="21" /></div>
            <button @click="go('library')"><span>01</span><div><strong>选择宠物</strong><small>内置角色即选即用</small></div></button>
            <button @click="go('companion')"><span>02</span><div><strong>设定身份</strong><small>朋友、恋人或学习搭子</small></div></button>
            <button @click="go('services')"><span>03</span><div><strong>连接服务</strong><small>使用你自己的 API</small></div></button>
          </article>

          <article class="card service-summary">
            <div class="card-heading"><div><span class="eyebrow">SERVICES</span><h3>能力状态</h3></div><Bot :size="21" /></div>
            <div class="service-list">
              <div><span class="service-icon ai"><Bot :size="17" /></span><p><strong>AI 对话</strong><small>{{ appState.ai.apiKey ? '已配置' : '等待配置' }}</small></p><i :class="{ on: !!appState.ai.apiKey }"></i></div>
              <div><span class="service-icon weather"><CloudSun :size="17" /></span><p><strong>天气关怀</strong><small>{{ appState.weather.city }}</small></p><i class="on"></i></div>
              <div><span class="service-icon music"><Music2 :size="17" /></span><p><strong>本地音乐</strong><small>无需 API</small></p><i class="on"></i></div>
            </div>
          </article>
        </div>
      </section>

      <PetLibrary v-else-if="section === 'library'" />
      <CompanionPanel v-else-if="section === 'companion'" />
      <ServicePanel v-else />
    </main>
  </div>
</template>
