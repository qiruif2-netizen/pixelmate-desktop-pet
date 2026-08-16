<script setup lang="ts">
import { computed, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { Check, MonitorUp, PawPrint, Search, Sparkles } from "lucide-vue-next";
import { appState, selectBuiltInPet } from "../lib/state";
import { builtInPets, type BuiltInPet, type PetCategory } from "../lib/builtInPets";

type Filter = "all" | PetCategory;
const activeFilter = ref<Filter>("all");
const keyword = ref("");
const desktopNotice = ref("");
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "cat", label: "猫咪" },
  { id: "dog", label: "狗狗" },
  { id: "bird", label: "鸟类" },
  { id: "robot", label: "机器人" },
];

const visiblePets = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return builtInPets.filter((pet) =>
    (activeFilter.value === "all" || pet.category === activeFilter.value) &&
    (!query || `${pet.name}${pet.breed}${pet.description}`.toLowerCase().includes(query)),
  );
});

const selected = computed(() => builtInPets.find((pet) => pet.id === appState.appearance.selectedPetId) ?? builtInPets[0]);

function choose(pet: BuiltInPet) {
  selectBuiltInPet(pet);
  desktopNotice.value = `${pet.name}已经准备好了，点击“住进桌面”即可。`;
}

async function openPet() {
  if ("__TAURI_INTERNALS__" in window) await invoke("show_pet");
  else desktopNotice.value = "请运行桌面版，网页预览不能创建透明桌宠窗口。";
}
</script>

<template>
  <section class="library-layout">
    <div class="library-main">
      <div class="library-toolbar">
        <div>
          <span class="eyebrow">BUILT-IN COMPANIONS</span>
          <h2>选择一位桌面伙伴</h2>
          <p class="muted">无需上传或生成，选中后立即使用。角色资源随应用离线提供。</p>
        </div>
        <label class="pet-search"><Search :size="16" /><input v-model="keyword" placeholder="搜索品种或名字" /></label>
      </div>

      <div class="filter-chips">
        <button v-for="filter in filters" :key="filter.id" :class="{ active: activeFilter === filter.id }" @click="activeFilter = filter.id">
          {{ filter.label }}
        </button>
      </div>

      <div class="pet-grid">
        <button
          v-for="pet in visiblePets"
          :key="pet.id"
          class="pet-card"
          :class="{ selected: appState.appearance.selectedPetId === pet.id && appState.appearance.source === 'builtin' }"
          @click="choose(pet)"
        >
          <span v-if="appState.appearance.selectedPetId === pet.id && appState.appearance.source === 'builtin'" class="selected-mark"><Check :size="13" /></span>
          <span class="pet-card-art"><img :src="pet.image" :alt="pet.breed" /></span>
          <span class="pet-card-copy"><strong>{{ pet.name }}</strong><small>{{ pet.breed }}</small></span>
        </button>
      </div>
      <div v-if="!visiblePets.length" class="empty-library"><PawPrint :size="35" /><span>没有找到匹配的宠物</span></div>
    </div>

    <aside class="card selected-pet-panel">
      <div class="card-heading"><div><span class="eyebrow">SELECTED</span><h3>当前伙伴</h3></div><Sparkles :size="20" /></div>
      <div class="selected-pet-art"><img :src="selected.image" :alt="selected.breed" /></div>
      <span class="pet-breed">{{ selected.breed }}</span>
      <h2>{{ selected.name }}</h2>
      <p>{{ selected.description }}</p>
      <blockquote>“{{ selected.greeting }}”</blockquote>
      <label class="library-scale">桌宠大小 <strong>{{ Math.round(appState.appearance.scale * 100) }}%</strong><input v-model.number="appState.appearance.scale" type="range" min="0.3" max="1.5" step="0.05" /></label>
      <div class="library-animation">
        <label>待机动画<select v-model="appState.appearance.animation"><option value="breathe">呼吸</option><option value="float">漂浮</option><option value="bounce">弹跳</option><option value="stroll">散步</option><option value="none">静止</option></select></label>
        <label>速度 {{ appState.appearance.animationSpeed.toFixed(1) }}×<input v-model.number="appState.appearance.animationSpeed" type="range" min="0.5" max="2" step="0.1" /></label>
      </div>
      <button class="primary full" @click="openPet"><MonitorUp :size="17" /> 住进桌面</button>
      <small class="license-note">首批角色为项目原创图形，可随开源代码分发。</small>
      <p v-if="desktopNotice" class="desktop-notice">{{ desktopNotice }}</p>
    </aside>
  </section>
</template>
