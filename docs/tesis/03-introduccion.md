# Introducción

Este proyecto empezó a tomar forma al inicio del ciclo 2026, cuando hubo que elegir un problema que se pudiera construir de punta a punta y, al mismo tiempo, explicar. La carrera ya había trabajado login, persistencia, pruebas y una interfaz. Faltaba un producto en el que esas piezas sirvieran para alguien que no es el programador.

El escenario elegido es el de una secretaría académica chica. No hace falta inventar una facultad entera. Alcanza con una tecnicatura, un plan de materias y un grupo de alumnos. En ese escenario se repite la misma conversación: ¿en qué aula es, qué día es el parcial, hasta cuándo me inscribo, qué nota me quedó? Cada pregunta, por separado, es breve. Juntas, le ocupan el día a quien debería estar publicando la novedad una sola vez.

Tomi-Alert parte de esa observación. La novedad se carga una vez. El sistema la reparte. El alumno decide si quiere el mail. Tomi contesta con lo que ya está cargado, y se calla cuando el alumno desactiva los mensajes. No hay un operador detrás del chat y no hay un modelo generativo. Hay reglas, y las reglas se pueden probar.

El trabajo se presenta como Proyecto Final de la Tecnicatura Universitaria en Desarrollo y Calidad de Software, Facultad de Ingeniería, Universidad del Norte Santo Tomás de Aquino. El autor es Enzo Martín Ferreyra. El desarrollo que se narra corre del 2 de marzo al 19 de junio de 2026. Esta memoria se entrega para revisión en octubre de 2026.

## Objetivos

El objetivo general es diseñar e implementar un MVP de avisos académicos con correo opcional y un asistente de consultas dentro del panel del alumno.

Los objetivos particulares son cuatro.

1. Diseñar la gestión de avisos para un grupo de alumnos inscriptos en una materia, y también para una lista puntual.
2. Enviar esos avisos por correo y dejar que cada alumno active o desactive ese canal, dejando constancia del envío o de la omisión.
3. Desarrollar un chatbot de consultas frecuentes y de recordatorios, alimentado solo por los datos del alumno que pregunta.
4. Integrar ese chatbot en el panel del alumno, de modo que la novedad y la consulta vivan en el mismo lugar.

Quedó fuera del objetivo, a propósito, reemplazar el sistema de autogestión de la facultad, inscribir de verdad a una mesa oficial, recuperar contraseñas, atender varias instituciones o usar un modelo de lenguaje.

## Problema a resolver

El problema no es la falta de una red social académica. El problema es la repetición. La secretaría ya sabe el aula, la fecha y la nota, porque los cargó. El alumno pregunta igual, porque el dato no le llegó, o le llegó por un canal que no mira, o le llegó mezclado con avisos de materias que no cursa.

Hay un segundo problema, más fino. No todos los alumnos quieren el mismo canal. Algunos leen el correo. Otros no quieren más mails y sí quieren un aviso dentro del panel. Tratar a los dos grupos por igual produce o ruido o silencio. El sistema tiene que registrar las dos decisiones y mostrarlas.

El tercer problema es de confianza. Si el chat contesta con un texto inventado, no sirve para una nota ni para una fecha de mesa. La respuesta tiene que poder rastrearse hasta un documento de la base. Por eso se descartó, desde el sprint 0, cualquier integración con un servicio de inteligencia artificial generativa.

## Impacto de la solución

El impacto que se busca es operativo, no estadístico. No se midió una secretaría real durante un cuatrimestre, y la tesis no va a fingir esa medición. El impacto se muestra con un recorrido concreto.

Cuando administración publica un cambio de aula de Fundamentos del Control de Calidad, Martin Ferreyra recibe el mail, porque lo tiene activo. Luis Gómez no lo recibe, porque lo desactivó. Los dos quedan en Envíos, uno como enviado o simulado y el otro como omitido. El aviso, además, aparece en el panel de quienes están inscriptos en esa materia. Un alumno de otra materia no lo ve.

Cuando se carga una nota, el efecto es el mismo, con una diferencia de pantalla: la nota no se publica como aviso. Se carga en Notas. El mail y el mensaje de Tomi salen igual, según las preferencias. María López tiene Tomi desactivado, así que a ella el recordatorio de chat no le llega aunque el mail sí.

Cuando se acerca el límite de una mesa, Tomi escribe una sola vez, y solo si se cumplen tres condiciones: la materia está regularizada, el alumno no figura inscripto y el límite cae dentro de los siete días. Martin está en ese caso con Fundamentos del Control de Calidad. El botón de recordatorios del panel, y el cron de las 8 de la mañana, hora de Argentina, hacen el mismo trabajo.

Ese es el impacto que se puede mostrar en la defensa sin pedir que el jurado imagine usuarios que no existen. La secretaría publica una vez. El alumno elige el canal. Tomi no inventa el dato.
