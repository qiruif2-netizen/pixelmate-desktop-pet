<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { EyeOff, Gift, Heart, MessageCircle, PackageOpen, Settings, X } from "lucide-vue-next";
import { invoke } from "@tauri-apps/api/core";
import { appState, interact } from "./lib/state";
import { builtInPets } from "./lib/builtInPets";

type PetBehavior = "idle" | "blink" | "look" | "groom" | "walk" | "happy" | "eat" | "sleep" | "drag";

const bubble = ref(appState.profile.greeting);
const menuOpen = ref(false);
const inventoryOpen = ref(false);
const flyingFood = ref("");
const behavior = ref<PetBehavior>("idle");
const actionFrame = ref(0);
const facing = ref<1 | -1>(1);
const selectedPet = computed(() => builtInPets.find((pet) => pet.id === appState.appearance.selectedPetId));
const actionImages = computed(() => selectedPet.value?.actions?.eat ?? []);
const hasSpriteSheet = computed(() => Boolean(selectedPet.value?.spriteSheet));
const displayImage = computed(() => behavior.value === "eat" && actionImages.value.length
  ? actionImages.value[actionFrame.value % actionImages.value.length]
  : appState.appearance.image);
const idleAnimationClass = computed(() => behavior.value === "idle"
  ? `idle-mode-${appState.appearance.animation}`
  : "");

const spriteFrame = computed(() => {
  const frames = selectedPet.value?.spriteSheet?.frames;
  if (!frames) return 0;
  const key = behavior.value === "walk"
    ? (actionFrame.value % 2 ? "walkB" : "walkA")
    : behavior.value === "eat" ? "groom" : behavior.value;
  return frames[key as keyof typeof frames] ?? frames.idle ?? 0;
});

const spriteStyle = computed(() => {
  const sheet = selectedPet.value?.spriteSheet;
  if (!sheet) return {};
  const column = spriteFrame.value % sheet.columns;
  const row = Math.floor(spriteFrame.value / sheet.columns);
  return {
    backgroundImage: `url(${sheet.image})`,
    backgroundSize: `${sheet.columns * 100}% ${sheet.rows * 100}%`,
    backgroundPosition: `${sheet.columns === 1 ? 0 : (column / (sheet.columns - 1)) * 100}% ${sheet.rows === 1 ? 0 : (row / (sheet.rows - 1)) * 100}%`,
  };
});

const petStyle = computed(() => ({
  "--pet-scale": String(appState.appearance.scale),
  "--pet-speed": String(appState.appearance.animationSpeed || 1),
  // Sprite packs are authored facing left. Mirror when the window moves right.
  "--pet-facing": String(-facing.value),
  "--frame-aspect": String(selectedPet.value?.spriteSheet?.frameAspect ?? .75),
}));

const foods = [
  { icon: "🍔", name: "芝士汉堡" },
  { icon: "🐟", name: "小鱼干" },
  { icon: "🥛", name: "牛奶" },
  { icon: "🧀", name: "芝士" },
  { icon: "🍗", name: "鸡腿" },
  { icon: "🥫", name: "猫罐头" },
];

let behaviorTimer: number | undefined;
let scheduleTimer: number | undefined;
let frameTimer: number | undefined;
let walkTimer: number | undefined;
let bubbleTimer: number | undefined;
let actionToken = 0;

function clearMotionTimers() {
  window.clearTimeout(behaviorTimer);
  window.clearInterval(frameTimer);
  window.clearInterval(walkTimer);
}

function say(text: string, duration = 4600) {
  bubble.value = text;
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => (bubble.value = ""), duration);
}

function scheduleNextBehavior(delay = 1800 + Math.random() * 3200) {
  window.clearTimeout(behaviorTimer);
  behaviorTimer = window.setTimeout(runNaturalBehavior, delay / Math.max(.6, appState.appearance.animationSpeed || 1));
}

function finishBehavior(token: number) {
  if (token !== actionToken) return;
  behavior.value = "idle";
  actionFrame.value = 0;
  window.clearInterval(frameTimer);
  window.clearInterval(walkTimer);
  scheduleNextBehavior();
}

function playBehavior(next: PetBehavior, duration: number, frameMs = 0) {
  clearMotionTimers();
  const token = ++actionToken;
  behavior.value = next;
  actionFrame.value = 0;
  if (frameMs) frameTimer = window.setInterval(() => actionFrame.value += 1, frameMs);
  if (next === "walk") void startNativeWalk(token, duration);
  behaviorTimer = window.setTimeout(() => finishBehavior(token), duration);
}

function runNaturalBehavior() {
  if (menuOpen.value || inventoryOpen.value || behavior.value !== "idle") {
    scheduleNextBehavior(1200);
    return;
  }

  const roll = Math.random();
  if (appState.stats.energy < 28 || (new Date().getHours() >= 23 && roll < .48)) {
    playBehavior("sleep", 5500);
  } else if (appState.appearance.animation === "stroll" && roll < .62) {
    playBehavior("walk", 3500 + Math.random() * 2600, 190);
  } else if (roll < .28) {
    playBehavior("blink", 520);
  } else if (roll < .49) {
    facing.value = Math.random() > .5 ? 1 : -1;
    playBehavior("look", 1700);
  } else if (roll < .68) {
    playBehavior("groom", 2300);
  } else {
    const weatherLine = appState.weather.temperature == null ? "" : `${appState.weather.city}现在 ${appState.weather.temperature}°C，出门要照顾好自己。`;
    const lines = ["我在这里陪你。", "要记得喝水呀。", "今天也辛苦啦。", "摸摸我嘛。", weatherLine].filter(Boolean);
    if (Math.random() < .45) say(lines[Math.floor(Math.random() * lines.length)]);
    playBehavior("idle", 2100);
  }
}

async function startNativeWalk(token: number, duration: number) {
  if (!("__TAURI_INTERNALS__" in window)) return;
  const { PhysicalPosition, currentMonitor, getCurrentWindow } = await import("@tauri-apps/api/window");
  if (token !== actionToken) return;
  const petWindow = getCurrentWindow();
  const [monitor, initialPosition] = await Promise.all([
    currentMonitor(),
    petWindow.outerPosition(),
  ]);
  if (!monitor || token !== actionToken) return;

  let x = initialPosition.x;
  const minX = monitor.workArea.position.x;
  const physicalWindowWidth = Math.max(180, window.outerWidth) * monitor.scaleFactor;
  const maxX = monitor.workArea.position.x + monitor.workArea.size.width - physicalWindowWidth;
  if (x < minX + 35) facing.value = 1;
  else if (x > maxX - 35) facing.value = -1;
  else facing.value = Math.random() > .5 ? 1 : -1;

  const tickMs = 68;
  const pixelsPerTick = 3.8 * monitor.scaleFactor * Math.max(.65, appState.appearance.animationSpeed || 1);
  const stopAt = Date.now() + duration;
  const moveNextFrame = async () => {
    if (token !== actionToken || Date.now() >= stopAt) return;
    x += pixelsPerTick * facing.value;
    if (x <= minX || x >= maxX) {
      x = Math.max(minX, Math.min(maxX, x));
      facing.value = facing.value === 1 ? -1 : 1;
    }
    await petWindow.setPosition(new PhysicalPosition(Math.round(x), initialPosition.y));
    if (token === actionToken && Date.now() < stopAt) {
      walkTimer = window.setTimeout(() => void moveNextFrame(), tickMs);
    }
  };
  void moveNextFrame();
}

function react(kind: "pet" | "gift") {
  interact(kind);
  say(kind === "pet" ? "嘿嘿，好舒服。" : "这是给我的吗？我会好好珍惜。");
  playBehavior("happy", 1800, 240);
  menuOpen.value = false;
}

function feed(food: (typeof foods)[number]) {
  clearMotionTimers();
  actionToken += 1;
  behavior.value = "look";
  flyingFood.value = food.icon;
  say(`${food.name}！是给我的吗？`, 3300);
  inventoryOpen.value = false;
  window.setTimeout(() => {
    flyingFood.value = "";
    interact("feed");
    say(`好吃！${food.name}果然最棒了。`);
    playBehavior("eat", 2500, 260);
  }, 850);
}

async function hideWindow() {
  if ("__TAURI_INTERNALS__" in window) {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().hide();
  } else window.close();
}

async function startDrag(event: MouseEvent) {
  if (event.button !== 0 || !("__TAURI_INTERNALS__" in window)) return;
  clearMotionTimers();
  actionToken += 1;
  behavior.value = "drag";
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().startDragging();
  behavior.value = "idle";
  scheduleNextBehavior(1600);
}

async function openManager() {
  menuOpen.value = false;
  if ("__TAURI_INTERNALS__" in window) await invoke("show_manager");
}

function checkSchedule() {
  const schedule = appState.schedule;
  if (!schedule.enabled) return;
  const now = new Date();
  if (!schedule.workdays.includes(now.getDay())) return;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const kind = time === schedule.workStart ? "start" : time === schedule.workEnd ? "end" : "";
  if (!kind) return;
  const reminderKey = `${date}-${kind}`;
  if (schedule.lastReminder === reminderKey) return;
  schedule.lastReminder = reminderKey;
  say(kind === "start" ? schedule.startMessage : schedule.endMessage, 7000);
  playBehavior("happy", 2800, 240);
}

watch(
  () => appState.appearance.animation,
  (mode) => {
    clearMotionTimers();
    actionToken += 1;
    behavior.value = "idle";
    actionFrame.value = 0;
    if (mode === "stroll") {
      behaviorTimer = window.setTimeout(() => playBehavior("walk", 4800, 190), 450);
    } else {
      scheduleNextBehavior(4600);
    }
  },
);

onMounted(() => {
  window.setTimeout(() => say(appState.profile.greeting), 300);
  scheduleNextBehavior(2200);
  checkSchedule();
  scheduleTimer = window.setInterval(checkSchedule, 15_000);
});

onBeforeUnmount(() => {
  clearMotionTimers();
  window.clearInterval(scheduleTimer);
  window.clearTimeout(bubbleTimer);
});
</script>

<template>
  <div class="pet-window" @contextmenu.prevent="menuOpen = !menuOpen; inventoryOpen = false">
    <div v-if="bubble" class="pet-bubble" @click="bubble = ''">{{ bubble }}</div>

    <div class="pet-stage" @mousedown="startDrag" @dblclick="react('pet')">
      <span v-if="flyingFood" class="flying-food">{{ flyingFood }}</span>
      <div v-if="appState.appearance.image" class="pet-sprite-wrap" :class="{ 'is-walking': behavior === 'walk' }" :style="petStyle">
        <span class="pet-ground-shadow" />
        <span v-if="behavior === 'eat'" class="chew-sparkles">✦ ♡ ✦</span>
        <div class="pet-facing">
          <div
            v-if="hasSpriteSheet && !(behavior === 'eat' && actionImages.length)"
            class="pet-atlas-frame"
            :class="[`behavior-${behavior}`, idleAnimationClass]"
            :style="spriteStyle"
          />
          <img
            v-else
            :src="displayImage"
            :class="[`behavior-${behavior}`, idleAnimationClass]"
            alt="桌宠"
            draggable="false"
          />
        </div>
      </div>
      <div v-else class="pet-missing">请先在角色管理器导入图片</div>
    </div>

    <div v-if="inventoryOpen" class="pet-inventory" @mousedown.stop>
      <header>
        <div><PackageOpen :size="16" /><strong>食物背包</strong></div>
        <button @click="inventoryOpen = false"><X :size="14" /></button>
      </header>
      <div class="food-grid">
        <button v-for="food in foods" :key="food.name" @click="feed(food)">
          <span>{{ food.icon }}</span><small>{{ food.name }}</small>
        </button>
      </div>
    </div>

    <div v-if="menuOpen" class="pet-menu" @mousedown.stop>
      <button @click="react('pet')"><Heart :size="15" /> 抚摸</button>
      <button @click="inventoryOpen = true; menuOpen = false"><PackageOpen :size="15" /> 打开背包</button>
      <button @click="react('gift')"><Gift :size="15" /> 礼物</button>
      <button @click="say(appState.profile.greeting); menuOpen = false"><MessageCircle :size="15" /> 说句话</button>
      <button @click="openManager"><Settings :size="15" /> 角色管理器</button>
      <button @click="hideWindow"><EyeOff :size="15" /> 隐藏<X :size="13" /></button>
    </div>
  </div>
</template>
