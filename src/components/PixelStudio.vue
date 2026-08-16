<script setup lang="ts">
import { computed, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { Download, ImagePlus, MonitorUp, RefreshCcw, Sparkles } from "lucide-vue-next";
import { appState } from "../lib/state";
import { pixelateImage, readImageFile } from "../lib/pixelate";

const busy = ref(false);
const error = ref("");
const removeNearWhite = ref(false);
const dragging = ref(false);
const desktopNotice = ref("");
const hasImage = computed(() => Boolean(appState.appearance.originalImage));

async function acceptFile(file?: File) {
  if (!file) return;
  busy.value = true;
  error.value = "";
  try {
    const source = await readImageFile(file);
    appState.appearance.originalImage = source;
    appState.appearance.source = "custom";
    appState.appearance.selectedPetId = "";
    await regenerate();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "图片处理失败";
  } finally {
    busy.value = false;
  }
}

async function regenerate() {
  if (!appState.appearance.originalImage) return;
  busy.value = true;
  error.value = "";
  try {
    appState.appearance.image = await pixelateImage(appState.appearance.originalImage, {
      size: appState.appearance.pixelSize,
      paletteSize: appState.appearance.paletteSize,
      removeNearWhite: removeNearWhite.value,
    });
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "图片处理失败";
  } finally {
    busy.value = false;
  }
}

function drop(event: DragEvent) {
  dragging.value = false;
  acceptFile(event.dataTransfer?.files?.[0]);
}

function download() {
  if (!appState.appearance.image) return;
  const link = document.createElement("a");
  link.href = appState.appearance.image;
  link.download = `${appState.profile.name || "pixelmate"}.png`;
  link.click();
}

async function openPet() {
  if (!appState.appearance.image) return;
  if ("__TAURI_INTERNALS__" in window) {
    await invoke("show_pet");
  } else {
    desktopNotice.value = "网页模式只能制作和预览角色。请运行 npm run tauri dev，才能启动真正的透明桌面宠物。";
  }
}
</script>

<template>
  <section class="studio-layout">
    <div class="card control-panel">
      <span class="eyebrow">IMAGE TO PIXEL</span>
      <h2>生成你的像素角色</h2>
      <p class="muted">所有处理都在本机完成，原图不会上传到服务器。</p>

      <label
        class="drop-zone"
        :class="{ dragging, filled: hasImage }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="drop"
      >
        <input type="file" accept="image/png,image/jpeg,image/webp" @change="acceptFile(($event.target as HTMLInputElement).files?.[0])" />
        <ImagePlus :size="28" />
        <strong>{{ hasImage ? '更换一张图片' : '点击或拖入图片' }}</strong>
        <span>PNG / JPG / WebP · 最大 8MB</span>
      </label>

      <div class="form-group">
        <div class="label-line"><label>像素精度</label><strong>{{ appState.appearance.pixelSize }} px</strong></div>
        <input v-model.number="appState.appearance.pixelSize" type="range" min="24" max="160" step="8" @change="regenerate" />
      </div>
      <div class="form-group">
        <div class="label-line"><label>颜色数量</label><strong>{{ appState.appearance.paletteSize }} 色</strong></div>
        <input v-model.number="appState.appearance.paletteSize" type="range" min="8" max="64" step="8" @change="regenerate" />
        <small class="field-hint">建议 16–24 色；颜色过多会保留照片噪点，看起来更花。</small>
      </div>
      <label class="toggle-row"><div><strong>智能移除背景</strong><span>只移除与图片边缘相连的相近颜色</span></div><input v-model="removeNearWhite" type="checkbox" @change="regenerate" /><i></i></label>

      <p v-if="error" class="error-message">{{ error }}</p>
      <button class="primary full" :disabled="!hasImage || busy" @click="regenerate"><RefreshCcw :size="17" :class="{ spinning: busy }" /> {{ busy ? '正在生成…' : '重新生成' }}</button>
    </div>

    <div class="preview-column">
      <div class="card preview-card">
        <div class="card-heading"><div><span class="eyebrow">PREVIEW</span><h3>桌宠预览</h3></div><span class="soft-badge"><Sparkles :size="13" /> 实时</span></div>
        <div class="checkerboard">
          <img v-if="appState.appearance.image" :src="appState.appearance.image" :class="`pet-${appState.appearance.animation}`" alt="像素桌宠预览" />
          <div v-else class="empty-preview"><ImagePlus :size="42" /><strong>等待图片</strong><span>左侧导入后将在这里预览</span></div>
        </div>
        <div class="preview-settings">
          <label>动画<select v-model="appState.appearance.animation"><option value="breathe">呼吸</option><option value="float">漂浮</option><option value="bounce">弹跳</option><option value="stroll">散步</option><option value="none">静止</option></select></label>
          <label>桌宠大小（{{ Math.round(appState.appearance.scale * 100) }}%）<input v-model.number="appState.appearance.scale" type="range" min="0.3" max="1.8" step="0.05" /></label>
        </div>
      </div>
      <div class="action-row">
        <button class="secondary" :disabled="!appState.appearance.image" @click="download"><Download :size="17" /> 导出 PNG</button>
        <button class="primary" :disabled="!appState.appearance.image" @click="openPet"><MonitorUp :size="17" /> 启动桌面宠物</button>
      </div>
      <p v-if="desktopNotice" class="desktop-notice">{{ desktopNotice }}</p>
    </div>
  </section>
</template>
