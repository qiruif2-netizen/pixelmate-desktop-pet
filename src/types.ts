export type CompanionRole = "friend" | "girlfriend" | "boyfriend" | "study" | "custom";
export type CompanionMood = "calm" | "happy" | "sleepy" | "curious";

export interface PetProfile {
  name: string;
  userName: string;
  role: CompanionRole;
  customRole: string;
  personality: string;
  greeting: string;
}

export interface PetStats {
  intimacy: number;
  mood: number;
  energy: number;
  level: number;
  experience: number;
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export interface WeatherConfig {
  city: string;
  latitude: number;
  longitude: number;
  providerUrl: string;
  apiKey: string;
  temperature: number | null;
  apparentTemperature: number | null;
  updatedAt: number | null;
}

export interface ScheduleConfig {
  enabled: boolean;
  workStart: string;
  workEnd: string;
  workdays: number[];
  startMessage: string;
  endMessage: string;
  lastReminder: string;
}

export interface PetAppearance {
  image: string;
  originalImage: string;
  selectedPetId: string;
  source: "builtin" | "custom";
  pixelSize: number;
  paletteSize: number;
  scale: number;
  animation: "breathe" | "float" | "bounce" | "stroll" | "none";
  animationSpeed: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface AppState {
  profile: PetProfile;
  stats: PetStats;
  ai: AiConfig;
  weather: WeatherConfig;
  schedule: ScheduleConfig;
  appearance: PetAppearance;
  messages: ChatMessage[];
  lastInteraction: number;
}
