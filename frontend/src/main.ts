import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

import 'primeicons/primeicons.css';
import './styles/main.css';

import App from './App.vue';
import { router } from './router';
import { useAuthStore } from './stores/auth';
import { setUnauthorizedHandler } from './api/client';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.gst-dark', // off por defecto
    },
  },
});
app.use(router);

// Conectar el interceptor 401 con el store + router
const auth = useAuthStore();
setUnauthorizedHandler(() => {
  auth.currentUser = null;
  auth.meAttempted = true;
  if (router.currentRoute.value.name !== 'login') {
    router.replace({ name: 'login' });
  }
});

app.mount('#app');
