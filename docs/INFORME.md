# Tomi-Alert — base del informe

Borrador para la entrega de Proyecto Final. Los números de story points son la planificación inicial, no una velocidad medida de un cuatrimestre ya cursado. La velocidad real se anota al cerrar cada sprint.

Autor: Enzo Martín Ferreyra. Equipo de una persona: los roles de Scrum Master, desarrollo y QA los cubre el mismo autor y se describen así en la defensa.

## Resumen ejecutivo

Tomi-Alert es una aplicación web para que el personal administrativo publique avisos académicos a los alumnos inscriptos en una materia, o a una lista puntual. El alumno recibe el aviso por email si lo tiene activado, lo ve en su panel y, si quiere, conversa con Tomi. Tomi responde fechas de parciales y finales, horarios, aulas, notas e inscripción a mesas usando los datos de ese alumno. También deja recordatorios en el chat cuando hay una novedad o cuando se acerca el límite de una mesa.

El chatbot no usa un modelo de lenguaje. Un motor de reglas detecta la intención, identifica la materia y arma la respuesta con plantillas. El comportamiento se puede probar y no depende de un servicio externo.

## Objetivos

- Diseñar e implementar la gestión de avisos académicos para grupos de alumnos.
- Enviar esos avisos por email y dejar que cada alumno active o desactive el correo.
- Desarrollar un chatbot de consultas frecuentes y recordatorios personalizados.
- Integrar ese chatbot en el panel del alumno.

## Problema e impacto

Las consultas repetidas de fechas, aulas y notas le llegan hoy al personal administrativo. Centralizar el aviso y dejar que Tomi responda con los datos ya cargados baja esas idas y vueltas, y el alumno elige si quiere el mail.

## Roles

- Scrum Master: planificación, tablero, review y retrospectiva.
- Desarrollo: frontend, backend, modelo de datos y motor de Tomi.
- QA: criterios de aceptación, casos del camino feliz, Postman y pruebas automáticas del motor.

## Arquitectura

Tres capas.

- Presentación: React, Vite, Material UI, React Router y Axios. Paneles separados para administración y alumno.
- Aplicación: Node.js y Express. JWT, bcrypt y roles `admin` y `alumno`. Carpetas `routes`, `controllers`, `models`, `middleware`, `services` y `chat`.
- Datos: MongoDB con Mongoose.

El mail sale por Nodemailer. En desarrollo puede simularse (`SKIP_SMTP=true`) o usar Ethereal. Los recordatorios de mesa corren todos los días a las 8, hora de Argentina, y también desde un botón del panel para la defensa.

Deploy previsto: frontend en Vercel o Netlify, API en Render, base en MongoDB Atlas. La descripción del servicio está en `render.yaml`.

## Modelo de datos

- `users`: nombre, documento de ingreso (DNI, pasaporte o `admin`), email de contacto, contraseña hasheada, rol, legajo (`UIA7` y cuatro dígitos, por ejemplo `UIA70035`).
- `subjects`: código, nombre, aula, horario.
- `enrollments`: alumno, materia, estado (`cursando` o `regular`), inscripto a la mesa.
- `grades`: alumno, materia, instancia, nota.
- `exams`: materia, tipo, fecha, límite de inscripción, aula.
- `notices`: título, cuerpo, tipo, materia opcional, destinatarios, autor.
- `preferences`: email activo, mensajes de Tomi activos.
- `conversations` y `messages`: hilo por alumno. Los mensajes de Tomi pueden ser proactivos.
- `mailLogs`: aviso, alumno, estado (`enviado`, `simulado`, `omitido`, `error`).

Un aviso con materia llega a los inscriptos. Uno personalizado llega a la lista elegida. El mail sale solo si el email está activo. El mensaje de Tomi sale solo si esa preferencia está activa.

## Tomi

Cada mensaje se normaliza (minúsculas, sin acentos). La intención se elige por palabras clave: saludo, ayuda, parciales, finales, horarios, aulas, notas, inscripción, avisos. La materia se busca por nombre o código. Si falta y el alumno cursa más de una, Tomi pregunta y guarda la intención para el turno siguiente. Si cursa una sola, la asume. Si no está inscripto, lo dice. Si no hay nota, responde: "No tenés nota cargada en {materia}."

Los recordatorios del chat:

- Al publicar un aviso o cargar una nota, si Tomi está activo.
- Una vez por mesa, si la materia está regularizada, no está inscripto y el límite cae dentro de los próximos 7 días.

## Tablero

Trello, con columnas Backlog, Bloqueado, Por hacer, En curso, Listo para prueba y Hecho. Cada tarjeta lleva código, historia ("como / necesito / para"), descripción, criterios de aceptación y story points (1, 2, 3, 5, 8).

El tablero lo crea el autor en su cuenta. Estas son las historias para cargarlo.

- TA-01 Como visitante necesito iniciar sesión con DNI o pasaporte para entrar al panel que corresponde a mi rol. La administración ingresa con el usuario `admin`. Aceptación: credenciales inválidas muestran error; admin entra a `/admin` y alumno a `/alumno`. 5 puntos.
- TA-02 Como alumno necesito ver mis materias, horario y aula. Aceptación: solo aparecen materias en las que está inscripto, con estado cursando o regular. 5 puntos.
- TA-03 Como administración necesito cargar materias, mesas, inscriptos y notas. Aceptación: una nota fuera de 0 a 10 se rechaza; no se carga una nota si el alumno no está inscripto. 8 puntos.
- TA-04 Como administración necesito publicar un aviso a una materia o a alumnos puntuales. Aceptación: un alumno de otra materia no ve el aviso. 5 puntos.
- TA-05 Como alumno necesito activar o desactivar el email y los mensajes de Tomi. Aceptación: con el email apagado el envío queda en estado omitido y el aviso igual se ve en el panel. 5 puntos.
- TA-06 Como alumno necesito preguntarle a Tomi por notas, fechas, horarios y aulas. Aceptación: la respuesta sale de mis datos; si no hay nota, Tomi lo dice; si curso varias materias y no nombro una, Tomi pregunta cuál. 8 puntos.
- TA-07 Como alumno necesito que Tomi me avise en el panel cuando hay una novedad o cuando se acerca el límite de una mesa que tengo regularizada y no estoy inscripto. Aceptación: no se repite el mismo recordatorio de mesa; si Tomi está desactivado, no llega el mensaje. 8 puntos.

Capacidad de partida para una persona: 13 a 20 puntos por sprint de dos semanas. Se ajusta con el primer sprint cerrado.

## Calendario planificado

Cada sprint dura dos semanas. Al cierre se anota objetivo, puntos planificados, puntos completados, carry over, una captura del tablero y una retrospectiva corta.

- Sprint 0 (8 puntos). Backlog, arquitectura, esqueleto y datos de demostración.
- Sprint 1 (13). Login, roles y layouts.
- Sprint 2 (20). Materias, inscripciones, notas, mesas y panel del alumno.
- Sprint 3 (13). Avisos por materia o por alumnos.
- Sprint 4 (13). Mail, preferencias y registro de envíos.
- Sprint 5 (20). Tomi conversacional y pruebas del motor.
- Sprint 6 (20). Mensajes proactivos, Postman, flujo automático y configuración de deploy.
- Sprint 7 (8). Informe, métricas y ensayo de la defensa. Sin funcionalidades nuevas.

## Métricas

Al cerrar un sprint se registran cuatro números: planificado, completado, carry over y el planificado del sprint siguiente. Con eso se arma el burndown y la velocidad. Hasta no cursar los sprints, la tabla de velocidad queda vacía a propósito: inventar puntos "completados" de un cuatrimestre que no ocurrió no sirve en la defensa.

## Pruebas

- Unitarias del motor, en `server/tests/engine.test.js`: normalización, prioridad de intenciones, materia faltante, turno siguiente, nota existente, nota ausente, materia no inscripta y texto del recordatorio.
- Flujo de API, en `server/tests/flow.test.js`: login de Ana, consulta de nota en Desarrollo de Software, aviso a Fund. del Control de Calidad con Luis omitido, mensaje proactivo y recordatorio de mesa.
- Postman: colección en `server/postman/Tomi-Alert.postman_collection.json`.
- Camino feliz manual: el recorrido de abajo.

No se promete un 80 % de cobertura de toda la interfaz. La cobertura que se defiende es la del motor de reglas y el recorrido de la demo.

## Presupuesto ilustrativo

Un perfil fullstack junior durante 4 meses, en el orden de magnitud de los presupuestos de la materia, más herramientas en cero (Trello, GitHub, MongoDB Atlas, Vercel, Render). Es una estimación académica de lo que costaría una persona que cubre los tres roles, no una cotización.

## Recorrido para ensayar la defensa

1. `docker compose up -d`, `npm run seed`, `npm run dev`.
2. Entrar como `admin` / `Admin123!`.
3. En Avisos, publicar "Cambio de aula" de tipo aula para Fund. del Control de Calidad (Segundo Año).
4. En Envíos, mostrar a Ana como simulado o enviado y a Luis como omitido.
5. Entrar como Ana, DNI `40111222` / `Alumno123!`. Ver el aviso y abrirlo en Tomi.
6. Escribir "qué nota tengo en desarrollo de software". Tiene que responder el parcial con 8.
7. Escribir "notas de fund. del control de calidad". Tiene que decir que no hay nota cargada.
8. Volver a administración, cargar una nota de Ana en Fund. del Control de Calidad y generar recordatorios de mesa.
9. Volver a Ana: el chat tiene la nota nueva y el recordatorio de inscripción, porque la mesa de Fund. del Control de Calidad vence dentro de 7 días y ella está regular y no inscripta.
10. Opcional: entrar como María (DNI `41222333`). Tiene Tomi desactivado, así que ese recordatorio no le llega. Lucía ingresa con el pasaporte `AAB123456`.

## Fuera del MVP

Autogestión real de la facultad, inscripción efectiva en un sistema externo, aplicación móvil, recuperación de contraseña, varias facultades y cualquier modelo de IA en el chatbot.
