import { createApp } from "vue";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import App from "./App.vue";
import { ScholarPreset } from "./theme";
import "../styles.css";

const app = createApp(App);

app.use(PrimeVue, {
  inputVariant: "filled",
  theme: {
    preset: ScholarPreset,
    options: {
      darkModeSelector: ".app-dark",
      cssLayer: {
        name: "primevue",
        order: "primevue, app",
      },
    },
  },
});
app.directive("tooltip", Tooltip);
app.mount("#app");
