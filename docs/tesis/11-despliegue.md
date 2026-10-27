# Despliegue previsto

Esta sección describe dónde va cada capa cuando el trabajo salga de la máquina de desarrollo. En la entrega de octubre de 2026 ese paso no se ejecutó. Las direcciones de abajo son el destino acordado, no una constatación de que el sitio ya responda en internet. Las figuras de esta memoria salen del entorno local, en `http://localhost:5173`, con la API en el puerto 4000.

## Por qué estos servicios y no Heroku

Heroku sigue existiendo. No es un producto abandonado. Desde noviembre de 2022 ya no ofrece dynos gratuitos. El plan más bajo es pago. Para una tesis, ese costo no compra nada que haga falta el día de la defensa: no hay usuarios simultáneos, no hay un acuerdo de nivel de servicio y no hay un dominio institucional que exigir.

Vercel encaja con el front. El cliente es una SPA armada con Vite. Vercel construye ese tipo de proyecto con un comando, publica un sitio estático y deja un dominio `vercel.app`. El destino previsto es `https://tomi-alert.vercel.app`. El plan hobby alcanza para la demostración.

Render encaja con la API. El servicio ya está descrito en `render.yaml`, con el nombre `tomi-alert-api`, el directorio `server`, la instalación de dependencias y el comando de arranque `npm start`. El destino previsto es `https://tomi-alert-api.onrender.com`. El plan gratuito se duerme si nadie lo usa. El primer pedido después de un rato de silencio tarda más. Para una defensa se despierta antes de entrar. Para una secretaría abierta todo el día habría que pasar a un plan pago. Esa limitación está dicha acá para no descubrirla en la mesa de examen.

MongoDB Atlas encaja con la base. El cluster compartido gratuito guarda el volumen de esta demostración. La base se llama `tomi-alert`. La cadena de conexión no se pega en el repositorio. Se carga como variable `MONGODB_URI` en Render.

El correo sigue siendo el SMTP de Gmail de la cuenta `infoalumnosunsta@gmail.com`, con contraseña de aplicación. En Render esas variables se cargan en el panel del servicio, las mismas que en local: host, puerto, usuario y la contraseña. `CLIENT_ORIGIN` tiene que ser la URL de Vercel, no `http://localhost:5173`. Si se olvida ese cambio, el navegador bloquea los pedidos y parece que “la API no anda”.

## Pasos, cuando se decida publicar

El orden importa.

1. Crear el cluster en Atlas y un usuario de base con permiso sobre `tomi-alert`. Anotar la cadena. No commitearla.
2. Crear el servicio web en Render a partir de `render.yaml`, o con los mismos datos a mano. Cargar `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (se puede completar después de tener Vercel), los datos SMTP y `MAIL_FROM`.
3. Publicar el cliente en Vercel, con el directorio del cliente, el comando de build de Vite y la variable que apunte a la API pública, si el front deja de usar el proxy de desarrollo.
4. Volver a Render y fijar `CLIENT_ORIGIN` con la URL final de Vercel.
5. Correr la semilla una vez contra Atlas, desde una máquina que tenga la cadena, para que la defensa no dependa de una base vacía. El seed se niega si el proceso está marcado como producción, salvo que se lo fuerce. Ese freno está para que un reinicio del servicio no borre la base. Cargarla es un paso aparte, hecho a conciencia.
6. Entrar a la URL de Vercel con el usuario admin y con el DNI de Martin. Publicar un aviso de prueba a un correo propio antes de usar la lista de alumnos.

El paso 6 no es vanidad. Con el SMTP real, un aviso les escribe a las direcciones cargadas. En la semilla esas direcciones son de demostración. Antes de apuntar a alumnos de verdad, el ensayo se hace con una cuenta que uno controla.

## Variables de entorno

Ninguna contraseña se copia en este capítulo. La tabla dice dónde vive cada dato y qué valor es público.

| Variable | Dónde | Qué es |
| --- | --- | --- |
| MONGODB_URI | Render, no el repositorio | Cadena del cluster. En local apunta a `tomi-alert`. En Atlas, a la misma base, con usuario propio. |
| JWT_SECRET | Render, no el repositorio | Secreto con el que se firma el token. En las pruebas es un valor fijo de test, distinto del de desarrollo. |
| CLIENT_ORIGIN | Render | URL del front. En local, `http://localhost:5173`. En el destino, `https://tomi-alert.vercel.app`. |
| MAIL_FROM | Render | `infoalumnosunsta@gmail.com`. Es también la cuenta que envía. |
| SMTP_HOST | Render | `smtp.gmail.com`. |
| SMTP_PORT | Render | `587`. |
| SMTP_SECURE | Render | `false`. En ese puerto la seguridad es STARTTLS, no la conexión implícita del 465. |
| SMTP_USER | Render | La misma cuenta de correo. |
| SMTP_PASS | Render, no el repositorio | Contraseña de aplicación de Gmail. No es la clave con la que una persona entra a la casilla, y no se transcribe acá. |
| SKIP_SMTP | Solo pruebas y desarrollo | Si está definida, no sale correo y el registro queda simulado. No se define en el destino real. |

El front, cuando deje de usar el proxy de Vite, necesita saber la URL de la API. Esa variable es del build de Vercel, no de Render. Si apunta a `localhost`, el sitio publicado le habla a la máquina de quien lo abre, y no a Render.

## Qué queda en cada lado

El front no guarda notas ni preferencias. Si Vercel se redeploya, no se pierde la cursada. La API no guarda los documentos: si Render se redeploya, la base sigue en Atlas. Lo que sí se pierde al redeployar la API es la memoria del proceso, y no hay nada importante ahí. El cron vuelve a programarse al arrancar. Los recordatorios ya enviados están en la base, así que no se duplican por un reinicio.

Esa separación es la misma de los sprints. Por eso el despliegue no obligó a reescribir el sistema. Obligó a sacar del código las direcciones y los secretos, y a decir en voz alta dónde vive cada uno.
