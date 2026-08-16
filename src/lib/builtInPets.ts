import goldenCatImage from "../assets/pets/golden-cat.png";
import silverCatImage from "../assets/pets/silver-cat.png";
import tabbyCatImage from "../assets/pets/tabby-cat.png";
import tuxedoCatImage from "../assets/pets/tuxedo-cat.png";
import goldenCatEatReady from "../assets/pets/golden-cat-eat-ready.png";
import goldenCatEatChew from "../assets/pets/golden-cat-eat-chew.png";
import goldenCatSprite from "../assets/pets/golden-cat-sprite.png";
import silverCatSprite from "../assets/pets/silver-cat-sprite.png";
import tabbyCatSprite from "../assets/pets/tabby-cat-sprite.png";
import tuxedoCatSprite from "../assets/pets/tuxedo-cat-sprite.png";
import teddyDogSprite from "../assets/pets/teddy-dog-sprite.png";
import yellowDogSprite from "../assets/pets/yellow-dog-sprite.png";
import borderCollieSprite from "../assets/pets/border-collie-sprite.png";
import parrotSprite from "../assets/pets/parrot-sprite.png";
import sparrowSprite from "../assets/pets/sparrow-sprite.png";
import teddyDogIdle from "../assets/pets/teddy-dog-idle.png";
import yellowDogIdle from "../assets/pets/yellow-dog-idle.png";
import borderCollieIdle from "../assets/pets/border-collie-idle.png";
import parrotIdle from "../assets/pets/parrot-idle.png";
import sparrowIdle from "../assets/pets/sparrow-idle.png";

export type PetCategory = "cat" | "dog" | "bird" | "robot";

export interface BuiltInPet {
  id: string;
  name: string;
  breed: string;
  category: PetCategory;
  description: string;
  image: string;
  greeting: string;
  actions?: {
    eat?: string[];
  };
  spriteSheet?: {
    image: string;
    columns: number;
    rows: number;
    frameAspect: number;
    frames: Partial<Record<"idle" | "blink" | "look" | "groom" | "walkA" | "walkB" | "happy" | "sleep", number>>;
  };
}

const standardFrames = { idle: 0, blink: 1, look: 2, groom: 3, walkA: 4, walkB: 5, happy: 1, sleep: 7 } as const;

function spriteSheet(image: string, frameAspect: number): NonNullable<BuiltInPet["spriteSheet"]> {
  return { image, columns: 4, rows: 2, frameAspect, frames: standardFrames };
}

function asImage(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function cat(primary: string, secondary: string, pattern: "tips" | "tabby" | "tuxedo") {
  const marks = pattern === "tabby"
    ? `<path d="M91 70h18v18H91zm28-8h18v22h-18zm28 8h18v18h-18zM69 119h22v12H69zm96 0h22v12h-22z" fill="${secondary}"/>`
    : pattern === "tuxedo"
      ? `<path d="M83 95h90v54h-18v37H101v-37H83z" fill="${secondary}"/>`
      : `<path d="M72 84h112v22H72zM87 59h22v27H87zm60 0h22v27h-22z" fill="${secondary}" opacity=".7"/>`;
  return asImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" shape-rendering="crispEdges">
    <path d="M58 88h18V52l34 25h36l34-25v36h18v96h-20v24H78v-24H58z" fill="${primary}"/>
    ${marks}<path d="M84 110h20v20H84zm68 0h20v20h-20z" fill="#302b27"/>
    <path d="M117 137h22v14h-22z" fill="#e78f87"/><path d="M106 158h44v9h-44z" fill="#fff5e9"/>
    <path d="M50 177h28v9H50zm128 0h28v9h-28z" fill="${secondary}"/>
  </svg>`);
}

function dog(primary: string, secondary: string, style: "curly" | "yellow" | "collie") {
  const coat = style === "collie"
    ? `<path d="M72 76h44v37H72zm70 0h42v37h-42zM99 139h58v58H99z" fill="${secondary}"/>`
    : style === "curly"
      ? `<g fill="${secondary}"><rect x="58" y="67" width="35" height="35"/><rect x="163" y="67" width="35" height="35"/><rect x="73" y="48" width="34" height="30"/><rect x="149" y="48" width="34" height="30"/></g>`
      : `<path d="M54 69h35v64H62zm113 0h35v64h-27z" fill="${secondary}"/>`;
  return asImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" shape-rendering="crispEdges">
    <path d="M66 77h25V55h74v22h25v104h-22v30H88v-30H66z" fill="${primary}"/>${coat}
    <path d="M91 111h19v20H91zm55 0h19v20h-19z" fill="#292825"/>
    <path d="M112 140h32v23h-32z" fill="#3b312c"/><path d="M119 163h18v14h-18z" fill="#e88282"/>
  </svg>`);
}

function bird(primary: string, wing: string, beak: string) {
  return asImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" shape-rendering="crispEdges">
    <path d="M82 56h72v18h25v24h22v70h-24v25H78v-22H55v-65h19V75h8z" fill="${primary}"/>
    <path d="M72 116h71v66H72z" fill="${wing}"/><path d="M201 103h31v24h-31z" fill="${beak}"/>
    <path d="M157 85h20v20h-20z" fill="#282725"/><path d="M99 193h12v24H83v-10h16zm47 0h12v24h28v-10h-28z" fill="#76533c"/>
  </svg>`);
}

function robot() {
  return asImage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" shape-rendering="crispEdges">
    <path d="M82 42h92v18h22v117h-22v31H82v-31H60V60h22z" fill="#f6f7f4"/>
    <path d="M82 74h92v62H82z" fill="#dce9e8"/><path d="M96 93h19v20H96zm45 0h19v20h-19z" fill="#3baeb8"/>
    <path d="M103 147h50v13h-50z" fill="#7b8e91"/><path d="M46 99h14v59H35v-44h11zm150 0h14v15h11v44h-25z" fill="#ecf0ed"/>
    <path d="M98 208h22v20H82v-11h16zm38 0h22v9h16v11h-38z" fill="#a8b8b8"/>
  </svg>`);
}

export const builtInPets: BuiltInPet[] = [
  {
    id: "golden-cat",
    name: "金豆",
    breed: "金渐层",
    category: "cat",
    description: "暖金色、黏人又贪吃的小猫。",
    image: goldenCatImage,
    greeting: "你回来啦，今天也要摸摸我。",
    actions: { eat: [goldenCatEatReady, goldenCatEatChew] },
    // The gentle closed-eye frame reads better for petting than the old raised-limb pose.
    spriteSheet: spriteSheet(goldenCatSprite, .75),
  },
  { id: "silver-cat", name: "银铃", breed: "银渐层", category: "cat", description: "安静优雅，喜欢守在窗口发呆。", image: silverCatImage, greeting: "我一直在这里等你。", spriteSheet: spriteSheet(silverCatSprite, .5) },
  { id: "tabby-cat", name: "阿狸", breed: "狸花猫", category: "cat", description: "聪明活泼的中华田园猫。", image: tabbyCatImage, greeting: "走，我们去看看今天有什么新鲜事。", spriteSheet: spriteSheet(tabbyCatSprite, 2 / 3) },
  { id: "tuxedo-cat", name: "奶盖", breed: "奶牛猫", category: "cat", description: "精力旺盛，偶尔会突然跑酷。", image: tuxedoCatImage, greeting: "嘿！我刚刚可没有捣乱。", spriteSheet: spriteSheet(tuxedoCatSprite, .5) },
  { id: "teddy-dog", name: "卷卷", breed: "泰迪", category: "dog", description: "热情的小卷毛，会认真迎接你。", image: teddyDogIdle, greeting: "终于等到你啦！", spriteSheet: spriteSheet(teddyDogSprite, 1) },
  { id: "yellow-dog", name: "旺财", breed: "大黄狗", category: "dog", description: "可靠、忠诚的中华田园犬。", image: yellowDogIdle, greeting: "放心忙吧，我帮你守着桌面。", spriteSheet: spriteSheet(yellowDogSprite, 1) },
  { id: "border-collie", name: "小七", breed: "边牧", category: "dog", description: "聪明敏捷，最喜欢完成小任务。", image: borderCollieIdle, greeting: "今天的任务是什么？交给我吧。", spriteSheet: spriteSheet(borderCollieSprite, 1) },
  { id: "parrot", name: "啾啾", breed: "鹦鹉", category: "bird", description: "爱说话的绿色小鹦鹉。", image: parrotIdle, greeting: "你好呀！你好呀！", spriteSheet: spriteSheet(parrotSprite, 1) },
  { id: "sparrow", name: "团团", breed: "麻雀", category: "bird", description: "圆滚滚的城市观察员。", image: sparrowIdle, greeting: "休息一下吧，窗外的风很好。", spriteSheet: spriteSheet(sparrowSprite, .75) },
  { id: "original-robot", name: "小白", breed: "原创陪伴机器人", category: "robot", description: "不属于任何影视 IP 的原创机器人。", image: robot(), greeting: "陪伴模块已启动，很高兴见到你。" },
];

export const defaultBuiltInPet = builtInPets[0];
