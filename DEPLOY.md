# Deploy a Render

Esta guía deja el backend (NestJS) y el frontend (Vue) andando en Render free tier, conectados a Supabase Postgres y a Google OAuth.

## Pre-requisitos

- Cuenta en [render.com](https://render.com) (podés loguearte con GitHub).
- El proyecto pusheado a un repo de GitHub al que Render pueda acceder.
- Supabase ya configurado y andando en local (la misma `DATABASE_URL` con el pooler que usás en `.env` sirve para prod).
- Credenciales de Google OAuth ya creadas (las que ya usás en local).

## 1. Crear el Blueprint en Render

1. Render Dashboard → **New +** → **Blueprint**.
2. Conectá tu repo de GitHub.
3. Render detecta el `render.yaml` de la raíz y te muestra los dos servicios:
   - `gastito-api` (Web Service, NestJS)
   - `gastito-web` (Static Site, Vue)
4. Click **Apply**. Va a fallar el primer deploy porque faltan los secrets — eso es esperado.

## 2. Completar las variables de entorno

### `gastito-api` (backend)

Ir al servicio → **Environment** → completar:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La connection string del **Transaction pooler** de Supabase (`postgresql://postgres.XXX:PASS@aws-0-XXX.pooler.supabase.com:6543/postgres`) |
| `GOOGLE_CLIENT_ID` | Tu Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Tu Client secret |
| `GOOGLE_CALLBACK_URL` | `https://gastito-web-qeud.onrender.com/api/auth/google/callback` (apunta al **frontend**, no al backend — el static site lo proxea para que la cookie quede first-party) |
| `FRONTEND_URL` | `https://gastito-web-qeud.onrender.com` (la URL del static site) |

`NODE_ENV`, `JWT_EXPIRES_IN`, `JWT_SECRET` y `COOKIE_DOMAIN` ya quedan seteadas automáticamente por el blueprint.

### `gastito-web` (frontend)

`VITE_API_URL` queda en `/api` por el blueprint (relativo, mismo origen). No hace falta tocar nada.

Si tu backend **no** está en `gastito-api-2g17.onrender.com`, editá `frontend/public/_redirects` y cambiá la URL del proxy ahí.

> **Importante**: las variables `VITE_*` se inyectan **en build time**. Si las cambiás, hay que volver a deployar.

## 3. Actualizar Google OAuth

En [Google Cloud Console](https://console.cloud.google.com/) → APIs y servicios → Credenciales → editá el Client ID que ya tenés:

**Authorized JavaScript origins** — agregar:
- `https://gastito-web-qeud.onrender.com`

**Authorized redirect URIs** — agregar:
- `https://gastito-web-qeud.onrender.com/api/auth/google/callback`

> Ojo: la redirect URI apunta al dominio del **frontend** (el static site), no al del backend. El static site tiene un proxy `_redirects` que reenvía `/api/*` al backend; así la cookie de sesión queda first-party en el dominio del frontend y funciona en mobile (iOS/Safari bloquea cookies cross-site).

Guardá los cambios. Esperá 1-2 minutos a que propague.

## 4. Re-deployar

En cada servicio en Render → **Manual Deploy** → **Deploy latest commit**.

Cuando termine:
- `gastito-api` debería loguear `🚀 Gastito API listening on http://localhost:10000/api`
- `gastito-web` queda servido en su URL

Abrí `https://gastito-web-qeud.onrender.com`, login con Google, y debería funcionar end-to-end.

## Caveats del free tier

- **Sleep**: el backend se duerme tras 15 min sin tráfico. El primer request después del sleep tarda ~30-60s en responder (Render levanta el container). Los subsiguientes son rápidos.
- **DB cold starts**: Supabase free también puede pausar el proyecto tras inactividad.
- **Build minutes**: hay un límite mensual; los re-deploys consumen.

Si el backend duerme y te molesta, o lo migrás a un plan pago ($7/mes) o ponés un cron externo (UptimeRobot, etc.) que pingee `/api/auth/me` cada 10 min para mantenerlo despierto.

## Troubleshooting

### "redirect_uri_mismatch" en login
Revisá que la redirect URI en Google Cloud sea **exactamente** `https://gastito-web-qeud.onrender.com/api/auth/google/callback` (apunta al **frontend**, no al backend). Sin barra al final, con `https`, con `/api/` en el medio. Y que coincida con `GOOGLE_CALLBACK_URL` en las env vars del backend.

### CORS error en el browser
Con el setup same-origin (proxy `_redirects`) no debería haber CORS en producción. Si lo ves, fijate que el frontend esté llamando a `/api/...` y no a la URL absoluta del backend.

### La cookie no persiste en mobile (Safari/Chrome iOS)
Este era el problema original que motivó el setup con proxy. Si seguís viéndolo:
- Verificá que el frontend esté llamando a `/api/...` (relativo) y no a `https://gastito-api...` (absoluto). En DevTools mobile, la URL de las requests tiene que empezar con el dominio del frontend.
- Verificá que `GOOGLE_CALLBACK_URL` apunte al frontend, no al backend. Si apunta al backend, Google redirige directo ahí, la cookie se setea en el dominio del backend, y volvés a tener el problema cross-site.
- En DevTools (incluso en mobile vía remote inspect) → Application → Cookies → tiene que aparecer `gastito_token` en el dominio del **frontend**.
- `COOKIE_DOMAIN` tiene que estar **vacío** para que la cookie quede atada al host que la setea (que es el dominio del frontend, vía proxy).

### "Cannot connect to database"
Revisá que el `DATABASE_URL` use el **pooler** de Supabase (`pooler.supabase.com:6543`), no la conexión directa. El plan free de Supabase solo expone IPv6 en la conexión directa, y Render no tiene IPv6.

### "synchronize is disabled in production"
Es esperado — TypeORM no auto-migra en prod. Si cambiaste el schema en local y querés aplicarlo en prod, opciones:
1. Correr la SQL manualmente en Supabase SQL Editor.
2. Para un reset completo (perdiendo datos): `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` y temporalmente setear `NODE_ENV=development` en Render, hacer un deploy, y volver a `production`.

Para uso real, lo correcto es generar migraciones de TypeORM y aplicarlas en cada deploy. Eso queda fuera del alcance del MVP.
