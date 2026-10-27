# Equipo y roles

El equipo es de una persona. Esa decisión se tomó el primer día y se mantuvo. Inventar compañeros para que el organigrama se parezca al de un grupo de cinco hubiera sido más fácil de dibujar y más difícil de defender. En la práctica, quien escribe cubrió tres roles. Los nombro por separado porque el trabajo de cada uno no es el mismo, aunque lo haga la misma persona.

## Scrum Master

El Scrum Master ordena el tablero, corta el alcance y cierra el sprint. En este proyecto eso significó, cada dos viernes, mirar las tarjetas en Hecho y las que seguían en En curso, anotar el carry over y no abrir una historia nueva para “aprovechar” el fin de semana. La capacidad de partida fue de 13 a 20 puntos. El sprint 0 y el sprint 7 se planificaron por debajo de ese rango porque no eran sprints de producto: uno preparaba el terreno y el otro cerraba la memoria.

También le tocó proteger el MVP. Cada vez que aparecía la tentación de sumar recuperación de contraseña, varias carreras o un modelo de lenguaje, el criterio fue el mismo: si no ayuda a publicar un aviso y a contestarlo con datos propios, no entra en este ciclo.

## Desarrollo

Desarrollo construyó el front, la API, el modelo y el motor de Tomi. El front es una SPA en React, con Vite, Material UI, React Router y Axios. La API es Express sobre Node.js. La base es MongoDB con Mongoose. El correo sale por Nodemailer. El motor de Tomi vive en el servidor, en un módulo aparte, para poder probarlo sin levantar la interfaz.

La regla de trabajo fue dejar el comportamiento importante en el servidor. La pantalla muestra y pide. Quién puede ver una nota, quién recibe un mail y qué contesta Tomi no se decide en el navegador.

## QA

QA escribió los criterios de aceptación antes de dar por hecha una historia, armó la colección de Postman y dejó pruebas automáticas del motor y del recorrido de defensa. No se fijó una meta del 80 % de cobertura sobre toda la interfaz. Esa cifra aparece en otros proyectos de la materia cuando hay un equipo de testing separado. Acá la cobertura que se sostiene es otra: el motor de reglas, y un flujo que cruza aviso, nota, omisión de mail y recordatorio de mesa.

El camino feliz se ensaya a mano, con los usuarios de demostración. El detalle está en el anexo de la defensa. Las pruebas automáticas están en `server/tests`. Si una de las dos falla, la historia no está hecha, aunque la pantalla se vea bien.

## Presentación del equipo

Enzo Martín Ferreyra es el autor del proyecto y el único integrante. Cursa la Tecnicatura Universitaria en Desarrollo y Calidad de Software en la Facultad de Ingeniería de la UNSTA. Durante el proyecto alternó los tres roles en el mismo día: a la mañana el tablero y el alcance, durante la jornada el código, y al cierre del sprint la prueba del recorrido.

No se incluye una fotografía. El documento tiene que poder leerse por lo que el sistema hace, no por una imagen personal. Los usuarios que aparecen en las capturas, como Martin Ferreyra, Luis Gómez o María López, son alumnos de demostración cargados por el seed. No son el autor. Martin Ferreyra, DNI 41344636, es el alumno con el que se muestra el camino completo: mail activo, Tomi activo, una nota de parcial en Desarrollo de Software y Fundamentos del Control de Calidad regularizada sin inscripción a la mesa.

Esa separación importa en la defensa. Si se mezclan el autor y el usuario de prueba, las preferencias de mail dejan de entenderse. El autor configura el sistema. Martin lo usa.
