<script setup lang="ts">
import { authApi } from '@/api/auth';

function login() {
  // Navegación full (no XHR) para que la cookie httpOnly del backend se setee
  // y luego redirija al frontend en /login/success.
  window.location.href = authApi.googleLoginUrl();
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="hero">
        <div class="emoji">💸</div>
        <h1>Gastito</h1>
        <p class="gst-muted">Dividí gastos con tus amigos en segundos</p>
      </div>

      <button class="google-btn" @click="login">
        <i class="pi pi-google" /> Entrar con Google
      </button>

      <p class="gst-muted" style="font-size: 0.8rem; text-align: center; margin-top: 1.5rem">
        Usamos Google para autenticarte. No guardamos tu contraseña.
      </p>

      <p class="made-with-love">
        Hecho con 💚 ·
        <a
          href="https://link.mercadopago.com.ar/gastito"
          target="_blank"
          rel="noopener noreferrer"
        >invitame un café ☕</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #d1fae5 0%, #f8fafc 100%);
}
.login-card {
  background: var(--gst-surface);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}
.hero {
  text-align: center;
  margin-bottom: 2rem;
}
.emoji {
  font-size: 3rem;
}
.hero h1 {
  font-size: 1.8rem;
  margin: 0.5rem 0 0.25rem;
}
.google-btn {
  width: 100%;
  background: white;
  border: 1px solid var(--gst-border);
  padding: 0.8rem 1rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  transition: background 0.15s ease;
}
.google-btn:hover {
  background: var(--gst-bg);
}
.made-with-love {
  font-size: 0.78rem;
  text-align: center;
  margin-top: 1.5rem;
  margin-bottom: 0;
  color: var(--gst-text-muted);
}
.made-with-love a {
  color: #d97706;
  font-weight: 600;
  text-decoration: none;
}
.made-with-love a:hover {
  text-decoration: underline;
}
</style>
