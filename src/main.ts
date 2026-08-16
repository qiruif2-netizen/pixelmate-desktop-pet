import { createApp } from "vue";
import App from "./App.vue";
import PetWindow from "./PetWindow.vue";
import "./styles.css";

const isPetWindow = window.location.hash === "#/pet" || new URLSearchParams(location.search).has("pet");
if (isPetWindow) {
  document.documentElement.classList.add("pet-mode");
  document.body.classList.add("pet-mode");
}
createApp(isPetWindow ? PetWindow : App).mount("#app");
