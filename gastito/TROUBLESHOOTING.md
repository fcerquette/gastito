# Troubleshooting — Backend Gastito

## Errores comunes y cómo arreglarlos

### `npm install` falla
- Verificá que tenés Node 20+: `node -v`
- Borrá `node_modules` y `package-lock.json`, probá de nuevo
- Si es por permisos en Windows: cerrá VS Code y corré como admin

### `Error: connect ECONNREFUSED` al iniciar el backend
- Es la base de datos. Verificá que `DATABASE_URL` en `.env` sea correcta
- Probá conectarte desde Supabase → SQL Editor para confirmar que la DB anda
- Si estás en una red corporativa puede haber firewall bloqueando puerto 5432

### `password authentication failed for user "postgres"`
- La password en `DATABASE_URL` está mal o tiene caracteres especiales sin escapar
- Si tu password tiene `@`, `#`, `:` o `/`, hay que URL-encodearlos
- Lo más simple: en Supabase, **Settings → Database → Reset database password** y poné una sin caracteres raros

### El backend levanta pero las tablas no se crean
- Mirá la consola del backend, busca errores de TypeORM
- En `.env`, asegurate de que `NODE_ENV=development` (en producción `synchronize` se desactiva)
- Si seguís sin tablas, en Supabase → Table Editor → tiene que aparecer `users`, `groups`, etc. después de levantar el backend

### Google OAuth — `redirect_uri_mismatch`
- En Google Cloud Console, en las credenciales OAuth, revisá que esté **exactamente**:
  - `http://localhost:3000/api/auth/google/callback`
- Sin barra final, sin `https`, sin puerto distinto
- Si lo cambiás, esperá 1-2 minutos a que Google propague

### Google OAuth — "Acceso bloqueado: la app no completó el proceso de verificación"
- En la pantalla de consentimiento, andá a **Test users → Add users** y agregá tu propio email
- Mientras la app esté en modo "Testing" solo los test users pueden entrar (es lo normal en desarrollo)

### La cookie no se guarda después del login
- En Chrome DevTools → Application → Cookies → http://localhost:3000 → tiene que estar `gastito_token`
- Si no aparece, fijate que el navegador no esté bloqueando cookies de terceros
- En desarrollo, las cookies de localhost a veces tienen problemas; usar el mismo origen ayuda

### `Cannot GET /api/auth/me` o 404
- Verificá que el backend imprimió `🚀 Gastito API listening on http://localhost:3000/api`
- El prefijo es `/api` (todo está bajo ese path)

## Comandos útiles

```bash
# Reiniciar el backend con cambios en caliente
npm run start:dev

# Ver errores de TypeScript sin levantar
npx tsc --noEmit

# Resetear base de datos (CUIDADO: borra todo)
# Andá a Supabase → SQL Editor y corré:
# DROP SCHEMA public CASCADE; CREATE SCHEMA public;
# Después reiniciá el backend para que recree las tablas
```

## Cómo ver los datos en la base

Supabase tiene un explorador de tablas integrado:
1. Andá al proyecto en supabase.com
2. **Table Editor** (ícono de tablas en el menú lateral)
3. Vas a ver `users`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`
4. Podés hacer queries SQL directas en **SQL Editor**

## Flujo de prueba manual recomendado

1. Abrí `http://localhost:3000/api/auth/google` en el navegador
2. Login con tu Google
3. Va a redirigir a `http://localhost:5173/login/success` y dar error (porque no hay frontend todavía) — **eso es normal**
4. Abrí DevTools → Application → Cookies → copiá el valor de `gastito_token`
5. Pegalo en `api-tests.http` en la variable `@token`
6. Probá las requests del archivo

¡Listo!
