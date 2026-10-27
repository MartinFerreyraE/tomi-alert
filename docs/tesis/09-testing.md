# Testing

La estrategia tiene tres patas. Ninguna reemplaza a las otras.

La primera pata es el motor. Son pruebas unitarias, rápidas, sin base y sin red. Viven en `server/tests/engine.test.js`. Cubren la normalización de acentos y espacios, la prioridad de la intención cuando el mensaje mezcla un saludo con una consulta, la prioridad de la inscripción cuando también se dice “final”, el pedido de materia si hay más de una, el uso de la materia pendiente en el turno siguiente, la nota cargada, la nota ausente, la materia única, la materia en la que el alumno no está inscripto, el texto del recordatorio, la pregunta cuando el nombre coincide con más de una materia, el aviso de un cambio de mesa y el aviso de una nota con instancia y valor.

La segunda pata es el flujo. Vive en `server/tests/flow.test.js`. Levanta la aplicación contra una base de prueba, corre la semilla y recorre el caso de la defensa. Martin se identifica. Pregunta la nota de Desarrollo de Software y obtiene el parcial con 8. Administración publica un aviso de aula sobre Fundamentos del Control de Calidad. Luis queda omitido. Martin queda simulado, porque la prueba fuerza `SKIP_SMTP`. El chat de Martin tiene el mensaje proactivo. El recordatorio de mesa se dispara a mano y Martin lo recibe. María, con Tomi desactivado, no recibe ese recordatorio. Después se carga una nota de final y se modifica el aula del final. El registro y el chat acompañan el cambio. El aula nueva aparece en el texto.

La tercera pata es manual. La colección de Postman, en `server/postman`, permite repetir los pedidos sin la pantalla. El recorrido escrito en el anexo permite repetirlos con la pantalla. Las dos cosas se ensayan antes de la defensa.

La tabla siguiente es la suite del motor, con la frase de cada prueba y lo que tiene que cumplirse para que el archivo pase. Los nombres de materia de esta tabla son los del archivo de prueba, no los de la semilla. El archivo usa Programación II, Calidad de Software, Desarrollo Web y las dos álgebras, porque el motor se prueba con un contexto armado en memoria. El panel, en cambio, habla de Desarrollo de Software y de Fund. del Control de Calidad. Las dos capas se complementan. Si el motor responde bien con un nombre inventado para el test y mal con el nombre del seed, la historia no está cerrada.

| Prueba | Qué afirma |
| --- | --- |
| Normaliza acentos y espacios | “¿Cuándo es el Parcial?” queda en “cuando es el parcial”. |
| Prioriza la consulta sobre el saludo | “hola, qué nota tengo” se lee como notas, no como saludo. |
| Prioriza inscripción cuando también dice final | “me quiero inscribir al final” se lee como inscripción. Inscripción pesa más que final cuando las dos palabras están. |
| Pide la materia si hay más de una | “¿cuándo es el parcial?” deja la intención pendiente y pregunta de qué materia. |
| Usa la materia pendiente | El turno siguiente, “Programación II”, responde esa materia y cita la fecha, sin pedir de nuevo la intención. |
| Devuelve la nota cargada | “qué nota tengo en programación” incluye el parcial y el 8. |
| Avisa cuando no hay nota | “notas de calidad de software” responde, textual, que no hay nota cargada en esa materia. |
| Asume la única materia inscripta | Con una sola materia, “horario” nombra Desarrollo Web y no pregunta. |
| Rechaza una materia ajena | “aula de desarrollo web”, si el alumno no está inscripto, lo dice y no inventa un aula. |
| Informa la inscripción a la mesa | La consulta de inscripción sobre una materia regularizada y sin mesa dice que está regularizada y que todavía no figura inscripto. |
| El fallback ofrece las opciones | Un texto sin sentido responde que no está seguro y ofrece Parciales entre las respuestas rápidas. |
| El recordatorio menciona la fecha límite | El texto del recordatorio nombra la materia y la fecha del límite. |
| El nombre ambiguo pregunta | “qué nota tengo en álgebra”, con Álgebra I y Álgebra II, pregunta cuál. “álgebra ii” en el turno siguiente cita el parcial con 7. |
| El aviso de mesa trae el dato nuevo | Editar el final arma una frase con la fecha, el aula y el límite, no un “se actualizó” vacío. |
| El aviso de nota trae instancia y valor | Cargar un parcial con 8 produce la frase que dice parcial y 8. |

Esas quince afirmaciones no abren el navegador. Si una cambia de texto, el archivo falla en la frase exacta. Esa es la razón de no usar un modelo de lenguaje: un modelo no deja fijar la oración.

La prueba de flujo hace lo que el motor no puede. Entra por HTTP, con la semilla, contra `tomi-alert-test`. Martin se identifica. Pregunta la nota de Desarrollo de Software y obtiene el parcial con 8. Administración publica el aviso de aula de Fund. del Control de Calidad. Luis queda omitido. Martin queda simulado, porque la prueba define `SKIP_SMTP`. El chat de Martin tiene el mensaje del aviso. El recordatorio se dispara a mano: Martin lo recibe y María, con Tomi apagado, no. Después se carga una nota y se cambia el aula de un final. El registro y el chat acompañan. Al filtrar envíos por estado omitido, las filas que vuelven son omitidas. El archivo cuenta dieciséis pruebas entre el motor y este recorrido. `npm test`, desde la carpeta del servidor, corre las dos.

## La colección de Postman

La colección está en `server/postman/Tomi-Alert.postman_collection.json`. No reemplaza a la pantalla. Sirve para repetir el recorrido de la API cuando el navegador estorba, y para mostrar que el rechazo de rol no depende de esconder un botón.

La variable `baseUrl` apunta a `http://localhost:4000`. La variable `token` empieza vacía. Login admin y Login Martin guardan, en un script de prueba de la colección, el token que devuelve el servidor. A partir de ahí, Sesión actual, Materias, Mesas, Notas, Avisos, Envíos, Preferencias, Chat y Recordatorios mandan `Authorization: Bearer` con esa variable.

El orden importa. Recordatorios de mesa es un pedido de administración. Si lo último que se ejecutó fue Login Martin, el token es de alumno y el servidor rechaza. Hay que volver a Login admin antes de disparar el recordatorio. Preferencias y Chat son del alumno: con el token de admin, Preferencias no es la pantalla que se está probando. La colección no adivina el rol. Quien la corre elige el login.

El pedido de Chat viaja con el texto “qué nota tengo en programación”. Esa frase es la del archivo de pruebas del motor, donde la materia se llama Programación II. Contra la semilla, Martin no tiene una materia con ese nombre. Para el ensayo hay que cambiar el cuerpo a “qué nota tengo en desarrollo de software”. Si se manda tal cual, Tomi no va a citar el parcial con 8, y el fallo es del texto del pedido, no del motor. Quedó escrito acá para no perder diez minutos el día del examen.

Envíos, en la colección, pide la lista sin filtros. La pantalla manda estado, alumno, texto, fechas, página y límite. Las dos formas pegan en la misma ruta. La colección muestra que la ruta existe y que exige admin. La pantalla muestra que el filtro no se hace en el navegador.

## Qué no se promete

No se promete un 80 % de cobertura de líneas sobre toda la interfaz. Esa meta, en un equipo con una persona de QA dedicada, mide otra cosa. Acá mediría mal: se puede cubrir de líneas un formulario y aún así romper el criterio de Luis omitido. El criterio se prueba en el flujo, no en un porcentaje.

Tampoco hay pruebas automáticas de cada píxel. Las pantallas se revisaron en el navegador: el ingreso, el inicio de administración, el filtro de envíos, la alineación de los campos de notas, la mayúscula del tipo de mesa y el primer acceso del alumno después de entrar. Cuando una de esas revisiones encontró un error, se corrigió y se volvió a mirar. El caso más claro fue el primer ingreso. El proceso de desarrollo se reiniciaba al cargar una librería de codificación y el panel del alumno mostraba que no podía traer los datos. Al actualizar, andaba. No era un fallo de Martin ni de la base. Se limitó la vigilancia del proceso a la carpeta de código propio, y el primer ingreso dejó de cortarse.

## Casos que la defensa puede pedir

Aviso de aula. Administración publica el cambio para Fundamentos del Control de Calidad. Martin recibe el mail. Luis queda omitido. Los dos están en Envíos.

Nota. Se carga en Notas, no en Avisos. Sale el mail y, si Tomi está activo, el chat. María recibe el mail y no el chat.

Mesa. Martin está regular y no inscripto. El recordatorio le llega una vez, dentro de la ventana de siete días.

Cambio de fecha. Editar el aula o borrar la mesa avisa con el dato nuevo o con la cancelación.

Filtro. En Envíos, el estado Omitido no muestra a Martin. El estado Simulado no muestra a Luis, en el juego de datos de la semilla.

Consulta. “Qué nota tengo en desarrollo de software” responde el parcial. La misma pregunta sobre Fundamentos del Control de Calidad, antes de cargar una nota, dice que no hay nota.

Si uno de esos casos falla el día de la defensa, no se explica con un discurso. Se mira Envíos y el chat. Por eso existen.
