# Gastito 💸

App mobile-first para dividir gastos entre amigos, estilo Splitwise pero hipersencilla.

## Stack

- **Backend:** NestJS + TypeORM + PostgreSQL
- **Frontend:** Vue 3 + Vite + Pinia + PrimeVue (Aura)
- **Auth:** Google OAuth 2.0 + JWT
- **Deploy:** Render (free tier) + Supabase (Postgres)

## Estructura del proyecto

```
gastito/
├── backend/         NestJS API
├── frontend/        Vue 3 SPA
├── render.yaml      Configuración de deploy
└── README.md
```

## Cómo correr local

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales (ver guía abajo)
npm run start:dev
```

API disponible en `http://localhost:3000`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App disponible en `http://localhost:5173`

## Configuración necesaria

### Google OAuth (gratis)

1. Andá a https://console.cloud.google.com/
2. Creá un proyecto nuevo (botón arriba a la izquierda)
3. En el menú lateral: **APIs & Services → Credentials**
4. **Create Credentials → OAuth client ID**
5. Si te pide configurar la pantalla de consentimiento:
   - User type: **External**
   - App name: Gastito
   - Email de soporte: tu email
   - Dominios autorizados: `localhost` (por ahora)
6. Application type: **Web application**
7. Authorized JavaScript origins:
   - `http://localhost:5173` (frontend dev)
   - `http://localhost:3000` (backend dev)
8. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
9. Copiá el **Client ID** y **Client Secret** al `.env` del backend

### Supabase Postgres (gratis indefinido)

1. Andá a https://supabase.com/ y creá cuenta
2. **New project** → elegí nombre, contraseña fuerte y región (São Paulo es la más cercana)
3. Esperá ~2 minutos a que se aprovisione
4. Andá a **Project Settings → Database → Connection string → URI**
5. Copiá esa URL al `.env` del backend como `DATABASE_URL`

## Deploy a Render

Ver guía detallada en `DEPLOY.md` (se genera en Fase 3)
