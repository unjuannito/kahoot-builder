# Producción con Docker

1. Clona el repositorio: `git clone <URL_DEL_REPOSITORIO> kahoot-builder`.
2. Crea `.env` a partir de `backend/.env.example` y rellena los secretos.
3. Para el dominio nuevo, usa `APP_BASE_PATH=/` y elige el puerto con `APP_PORT=8080`.
4. Arranca: `docker compose -f docker-compose.prod.yml up -d --build`.

Para actualizar una instalación existente: `git pull` y después `docker compose -f docker-compose.prod.yml up -d --build`.

El proxy publica la web en `https://kahoot-builder.jcanas.es` y la API en `/api`. Ajusta `CORS_ORIGIN` y `GOOGLE_CALLBACK_URL` en `.env` y vuelve a construir.

Docker publica un único puerto (`APP_PORT`, por defecto `8080`). Dentro del contenedor la web está en `/` y la API en `/api/`; el Nginx público debe enviar el dominio nuevo a ese puerto.

Para un dominio bajo subruta, puedes usar por ejemplo `APP_BASE_PATH=/kahoot-builder`.

## Prueba local antes de subirlo

Puedes probar el mismo subpath con Nginx local en el puerto `8080`:

```powershell
# Terminal 1: backend
cd backend
$env:PORT=3000
npm run dev

# Terminal 2: frontend
cd frontend
$env:APP_BASE_PATH="/kahoot-builder"
npm run dev -- --host 0.0.0.0 --port 5173

# Terminal 3: Nginx (usa deploy/nginx.local.conf)
nginx -c "$PWD/deploy/nginx.local.conf" -p "$PWD"
```

Abre `http://localhost:8080/kahoot-builder/`. Si no quieres usar Nginx durante el desarrollo, abre directamente `http://localhost:5173/kahoot-builder/`; en ese caso la API debe estar disponible en el puerto 3000.
