import { reactive, watch } from "vue";
import type { AppState } from "../types";
import { defaultBuiltInPet, type BuiltInPet } from "./builtInPets";

const STORAGE_KEY = "pixelmate-state-v1";

const defaults: AppState = {
  profile: {
    name: defaultBuiltInPet.name,
    userName: "你",
    role: "friend",
    customRole: "",
    personality: "温柔、活泼、真诚，不说教，擅长倾听和鼓励。",
    greeting: defaultBuiltInPet.greeting,
  },
  stats: { intimacy: 18, mood: 82, energy: 76, level: 1, experience: 20 },
  ai: {
    baseUrl: "",
    apiKey: "",
    model: "",
    systemPrompt: "你是一位温柔、有边界感的虚拟陪伴者。回答简短自然，避免说教。",
  },
  weather: {
    city: "上海",
    latitude: 31.2304,
    longitude: 121.4737,
    providerUrl: "https://api.open-meteo.com/v1/forecast",
    apiKey: "",
    temperature: null,
    apparentTemperature: null,
    updatedAt: null,
  },
  schedule: {
    enabled: true,
    workStart: "09:00",
    workEnd: "18:00",
    workdays: [1, 2, 3, 4, 5],
    startMessage: "上班时间到啦，今天也一起加油。",
    endMessage: "下班啦，辛苦一天了，记得好好休息。",
    lastReminder: "",
  },
  appearance: {
    image: defaultBuiltInPet.image,
    originalImage: "",
    selectedPetId: defaultBuiltInPet.id,
    source: "builtin",
    pixelSize: 64,
    paletteSize: 16,
    scale: 0.68,
    animation: "breathe",
    animationSpeed: 1,
  },
  messages: [],
  lastInteraction: Date.now(),
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaults);
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      ...structuredClone(defaults),
      ...parsed,
      profile: { ...defaults.profile, ...parsed.profile },
      stats: { ...defaults.stats, ...parsed.stats },
      ai: { ...defaults.ai, ...parsed.ai, apiKey: parsed.ai?.apiKey ?? "" },
      weather: { ...defaults.weather, ...parsed.weather },
      schedule: { ...defaults.schedule, ...parsed.schedule },
      appearance: { ...defaults.appearance, ...parsed.appearance },
      messages: parsed.messages?.slice(-60) ?? [],
    };
  } catch {
    return structuredClone(defaults);
  }
}

export const appState = reactive<AppState>(loadState());

export function selectBuiltInPet(pet: BuiltInPet) {
  appState.appearance.image = pet.image;
  appState.appearance.originalImage = "";
  appState.appearance.selectedPetId = pet.id;
  appState.appearance.source = "builtin";
  appState.profile.name = pet.name;
  appState.profile.greeting = pet.greeting;
}

// Keep the hidden pet WebView in sync with changes made in the manager window.
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  Object.assign(appState, loadState());
});

let saveTimer: number | undefined;
watch(
  appState,
  () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      } catch (error) {
        console.warn("无法保存完整状态，图片可能超出浏览器存储上限。", error);
      }
    }, 180);
  },
  { deep: true },
);

export function interact(kind: "pet" | "feed" | "gift") {
  const increments = {
    pet: { intimacy: 1, mood: 3, energy: 0, experience: 2 },
    feed: { intimacy: 1, mood: 1, energy: 8, experience: 2 },
    gift: { intimacy: 4, mood: 6, energy: 1, experience: 5 },
  }[kind];

  appState.stats.intimacy = Math.min(100, appState.stats.intimacy + increments.intimacy);
  appState.stats.mood = Math.min(100, appState.stats.mood + increments.mood);
  appState.stats.energy = Math.min(100, appState.stats.energy + increments.energy);
  appState.stats.experience += increments.experience;
  appState.lastInteraction = Date.now();

  const needed = appState.stats.level * 100;
  if (appState.stats.experience >= needed) {
    appState.stats.experience -= needed;
    appState.stats.level += 1;
  }
}
