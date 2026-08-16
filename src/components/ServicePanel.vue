<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Bot, Check, Clock3, CloudSun, Eye, EyeOff, LoaderCircle, LocateFixed, Music2, Play, Power, Square, Upload } from "lucide-vue-next";
import { appState } from "../lib/state";
import { testAiConnection } from "../lib/ai";

const showKey = ref(false);
const testing = ref(false);
const testResult = ref("");
const weatherText = ref("");
const weatherBusy = ref(false);
const tracks = ref<Array<{ name: string; url: string }>>([]);
const currentTrack = ref(0);
const audio = new Audio();
const playing = ref(false);
const localClock = ref("");
const locationBusy = ref(false);
const autostartEnabled = ref(false);
const autostartBusy = ref(false);
const autostartText = ref("");
let clockTimer: number | undefined;

async function loadAutostartState() {
  if (!("__TAURI_INTERNALS__" in window)) {
    autostartText.value = "开机自启只在安装后的桌面应用中可用。";
    return;
  }
  try {
    const { isEnabled } = await import("@tauri-apps/plugin-autostart");
    autostartEnabled.value = await isEnabled();
  } catch (error) {
    autostartText.value = error instanceof Error ? error.message : "无法读取开机自启状态";
  }
}

async function changeAutostart(event: Event) {
  const requested = (event.target as HTMLInputElement).checked;
  autostartBusy.value = true;
  autostartText.value = "";
  try {
    const { disable, enable, isEnabled } = await import("@tauri-apps/plugin-autostart");
    if (requested) await enable();
    else await disable();
    autostartEnabled.value = await isEnabled();
    autostartText.value = autostartEnabled.value
      ? "已获得你的授权，下次登录系统后会直接显示桌宠。"
      : "已关闭，PixelMate 不会随系统启动。";
  } catch (error) {
    autostartEnabled.value = !requested;
    autostartText.value = error instanceof Error ? error.message : "开机自启设置失败";
  } finally {
    autostartBusy.value = false;
  }
}

function updateClock() {
  localClock.value = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());
}

async function testAi() {
  testing.value = true;
  testResult.value = "";
  try {
    testResult.value = await testAiConnection(appState.ai);
  } catch (error) {
    testResult.value = error instanceof Error ? error.message : "连接失败";
  } finally {
    testing.value = false;
  }
}

async function queryWeather() {
  weatherBusy.value = true;
  weatherText.value = "";
  try {
    const base = appState.weather.providerUrl.replace(/\/+$/, "");
    const query = new URLSearchParams({
      latitude: String(appState.weather.latitude),
      longitude: String(appState.weather.longitude),
      current: "temperature_2m,apparent_temperature,weather_code",
      timezone: "auto",
    });
    if (appState.weather.apiKey) query.set("apikey", appState.weather.apiKey);
    const response = await fetch(`${base}?${query}`);
    if (!response.ok) throw new Error(`天气请求失败：${response.status}`);
    const data = await response.json();
    const current = data.current;
    appState.weather.temperature = current.temperature_2m;
    appState.weather.apparentTemperature = current.apparent_temperature;
    appState.weather.updatedAt = Date.now();
    weatherText.value = `${appState.weather.city} ${current.temperature_2m}°C，体感 ${current.apparent_temperature}°C`;
  } catch (error) {
    weatherText.value = error instanceof Error ? error.message : "天气读取失败";
  } finally {
    weatherBusy.value = false;
  }
}

function useCurrentLocation() {
  locationBusy.value = true;
  weatherText.value = "正在请求系统位置权限…";
  if (!navigator.geolocation) {
    weatherText.value = "当前系统不支持位置读取，请手动填写经纬度。";
    locationBusy.value = false;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      appState.weather.latitude = Number(position.coords.latitude.toFixed(4));
      appState.weather.longitude = Number(position.coords.longitude.toFixed(4));
      appState.weather.city = "当前位置";
      locationBusy.value = false;
      await queryWeather();
    },
    (error) => {
      weatherText.value = error.code === 1 ? "位置权限未开启，请在 Windows/macOS 设置中允许 PixelMate 读取位置。" : `无法读取本机位置：${error.message}`;
      locationBusy.value = false;
    },
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 15 * 60_000 },
  );
}

function addMusic(files?: FileList | null) {
  if (!files) return;
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("audio/")) continue;
    tracks.value.push({ name: file.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(file) });
  }
}

function toggleMusic(index = currentTrack.value) {
  const track = tracks.value[index];
  if (!track) return;
  if (currentTrack.value !== index || audio.src !== track.url) {
    currentTrack.value = index;
    audio.src = track.url;
  }
  if (audio.paused) {
    audio.play();
    playing.value = true;
  } else {
    audio.pause();
    playing.value = false;
  }
}

audio.addEventListener("ended", () => {
  if (!tracks.value.length) return;
  currentTrack.value = (currentTrack.value + 1) % tracks.value.length;
  audio.src = tracks.value[currentTrack.value].url;
  audio.play();
});

onMounted(() => {
  updateClock();
  clockTimer = window.setInterval(updateClock, 1000);
  void loadAutostartState();
});

onBeforeUnmount(() => {
  window.clearInterval(clockTimer);
  audio.pause();
  tracks.value.forEach((track) => URL.revokeObjectURL(track.url));
});
</script>

<template>
  <section class="services-layout">
    <article class="card service-config ai-config">
      <div class="service-title"><span class="service-icon ai"><Bot :size="19" /></span><div><span class="eyebrow">BRING YOUR OWN API</span><h3>AI 对话服务</h3></div></div>
      <p class="muted">兼容 OpenAI Chat Completions 格式。费用和额度由你与服务商结算。</p>
      <label>API Base URL<input v-model.trim="appState.ai.baseUrl" placeholder="https://api.example.com/v1" /></label>
      <label>API Key<div class="secret-input"><input v-model.trim="appState.ai.apiKey" :type="showKey ? 'text' : 'password'" placeholder="sk-••••••••" /><button @click="showKey = !showKey"><EyeOff v-if="showKey" :size="17" /><Eye v-else :size="17" /></button></div></label>
      <label>模型名称<input v-model.trim="appState.ai.model" placeholder="例如：gpt-4.1-mini" /></label>
      <label>角色提示词<textarea v-model="appState.ai.systemPrompt" rows="3"></textarea></label>
      <button class="secondary full" :disabled="testing" @click="testAi"><LoaderCircle v-if="testing" :size="17" class="spinning" /><Check v-else :size="17" /> 测试连接</button>
      <p v-if="testResult" class="result-message">{{ testResult }}</p>
    </article>

    <article class="card service-config weather-config">
      <div class="service-title"><span class="service-icon weather"><CloudSun :size="19" /></span><div><span class="eyebrow">WEATHER CARE</span><h3>天气关怀</h3></div></div>
      <p class="local-clock"><Clock3 :size="16" /><span><strong>本机时间</strong>{{ localClock }}</span></p>
      <p class="muted">点击定位会调用 Windows/macOS 的系统位置权限，再使用免 Key 的 Open-Meteo 获取天气。</p>
      <button class="secondary full locate-button" :disabled="locationBusy || weatherBusy" @click="useCurrentLocation"><LoaderCircle v-if="locationBusy" :size="17" class="spinning" /><LocateFixed v-else :size="17" /> 自动读取本机位置和天气</button>
      <div class="two-fields"><label>城市<input v-model="appState.weather.city" /></label><label>API Key（可选）<input v-model="appState.weather.apiKey" type="password" /></label></div>
      <div class="two-fields"><label>纬度<input v-model.number="appState.weather.latitude" type="number" step="0.0001" /></label><label>经度<input v-model.number="appState.weather.longitude" type="number" step="0.0001" /></label></div>
      <label>天气 API 地址<input v-model="appState.weather.providerUrl" /></label>
      <button class="secondary full" :disabled="weatherBusy" @click="queryWeather"><LoaderCircle v-if="weatherBusy" :size="17" class="spinning" /><CloudSun v-else :size="17" /> 获取当前天气</button>
      <p v-if="weatherText" class="weather-result">{{ weatherText }}</p>
    </article>

    <article class="card service-config schedule-config">
      <div class="service-title"><span class="service-icon schedule"><Clock3 :size="19" /></span><div><span class="eyebrow">DAILY RHYTHM</span><h3>上下班提醒</h3></div></div>
      <p class="muted">使用本机时间判断，不需要联网。提醒会由桌宠气泡显示。</p>
      <label class="toggle-row"><div><strong>启用工作日提醒</strong><span>默认周一至周五</span></div><input v-model="appState.schedule.enabled" type="checkbox" /><i></i></label>
      <div class="two-fields"><label>上班时间<input v-model="appState.schedule.workStart" type="time" /></label><label>下班时间<input v-model="appState.schedule.workEnd" type="time" /></label></div>
      <label>上班问候<input v-model="appState.schedule.startMessage" maxlength="80" /></label>
      <label>下班问候<input v-model="appState.schedule.endMessage" maxlength="80" /></label>
      <p class="schedule-summary">周一至周五 · {{ appState.schedule.workStart }} 上班 · {{ appState.schedule.workEnd }} 下班</p>
    </article>

    <article class="card service-config startup-config">
      <div class="service-title"><span class="service-icon startup"><Power :size="19" /></span><div><span class="eyebrow">SYSTEM STARTUP</span><h3>开机自动陪伴</h3></div></div>
      <p class="muted">默认关闭。只有你主动打开开关后，PixelMate 才会注册为登录启动项；之后可以随时关闭。</p>
      <label class="toggle-row" :class="{ disabled: autostartBusy }">
        <div><strong>登录系统后自动显示桌宠</strong><span>不会自动打开角色管理器</span></div>
        <input type="checkbox" :checked="autostartEnabled" :disabled="autostartBusy" @change="changeAutostart" /><i></i>
      </label>
      <p v-if="autostartText" class="result-message">{{ autostartText }}</p>
      <p class="startup-privacy">宠物选择、养成进度和 API 配置保存在本机，重新开机不需要再次填写。请勿在公共电脑启用。</p>
    </article>

    <article class="card service-config music-config">
      <div class="service-title"><span class="service-icon music"><Music2 :size="19" /></span><div><span class="eyebrow">LOCAL MUSIC</span><h3>一起听歌</h3></div></div>
      <p class="muted">选择你拥有使用权的本地音频。文件不会上传，关闭后需重新选择。</p>
      <label class="music-upload"><input type="file" multiple accept="audio/*" @change="addMusic(($event.target as HTMLInputElement).files)" /><Upload :size="22" /><strong>选择本地音乐</strong><span>MP3 / WAV / M4A / FLAC</span></label>
      <div v-if="tracks.length" class="track-list">
        <button v-for="(track, index) in tracks" :key="track.url" :class="{ active: currentTrack === index && playing }" @click="toggleMusic(index)">
          <span>{{ index + 1 }}</span><strong>{{ track.name }}</strong><Square v-if="currentTrack === index && playing" :size="14" /><Play v-else :size="14" />
        </button>
      </div>
      <div v-else class="empty-tracks"><Music2 :size="30" /><span>还没有选择音乐</span></div>
    </article>

    <article class="api-notice">
      <strong>服务与隐私声明</strong>
      <p>本项目不提供共享 API Key 或第三方服务额度。联网功能由用户自行选择服务商并承担费用。聊天内容、位置或附件仅在用户启用相应功能时发送至其配置的服务商。</p>
    </article>
  </section>
</template>
