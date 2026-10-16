# Tomi-Alert

Sistema de avisos académicos para personal administrativo, con mail y un chatbot por reglas (Tomi) en el panel del alumno. No usa un modelo de lenguaje: Tomi consulta MongoDB.

## Requisitos

- Node.js 22
- Docker, para MongoDB

## Cómo levantarlo

```powershell
docker compose up -d
npm install
npm install --prefix server
npm install --prefix client
npm run seed
npm run dev
```

- Cliente: http://localhost:5173
- API: http://localhost:4000/api/health

## Cuentas de demostración

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administración | admin | Admin123! |
| Alumna, mail y Tomi activos | 40111222 (DNI) | Alumno123! |
| Alumno, mail desactivado y Tomi activo | 38999888 (DNI) | Alumno123! |
| Alumna, Tomi desactivado | 41222333 (DNI) | Alumno123! |
| Alumna con pasaporte | AAB123456 | Alumno123! |

El resto de los alumnos usa `Alumno123!`.

Por defecto `SKIP_SMTP=true` en `server/.env`: el mail se registra como simulado y no sale a internet. Para un envío real, completá `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` y poné `SKIP_SMTP=false`. Sin SMTP configurado, el servidor intenta una cuenta de prueba de Ethereal y, si no puede, deja el envío como simulado.

## Pruebas

```powershell
npm test
```

Incluye el motor de reglas de Tomi y el recorrido de la defensa contra la base `tomi-alert-test` (hace falta que el contenedor de Mongo esté arriba).

La colección de Postman está en `server/postman/Tomi-Alert.postman_collection.json`.

## Recorrido de la defensa

1. Entrá como administración y publicá un aviso de cambio de aula para Fund. del Control de Calidad.
2. En Envíos, Ana figura como enviada o simulada y Luis como omitido.
3. Entrá como Ana. El aviso está en Avisos y Tomi lo dejó en el chat.
4. Preguntale a Tomi: "qué nota tengo en programación". Responde el parcial con 8.
5. Volvé a administración y pulsá "Generar recordatorios de mesa". Ana, con Calidad regularizada y sin inscripción, recibe el recordatorio.

El guion completo, el backlog y el índice del informe están en [docs/INFORME.md](docs/INFORME.md).

## Deploy

- API: el archivo `render.yaml` describe el servicio en Render. Variables: `MONGODB_URI` (Atlas), `JWT_SECRET`, `CLIENT_ORIGIN`, y las de SMTP si el mail tiene que salir de verdad.
- Cliente: Vercel o Netlify, con `VITE_API_URL` apuntando a la API. `client/vercel.json` reescribe las rutas de la SPA.
