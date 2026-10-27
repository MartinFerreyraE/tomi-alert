# Arquitectura de la aplicación

La aplicación tiene tres capas. La separación no es un dibujo para la carátula: es la razón por la que una prueba del motor no necesita abrir el navegador, y por la que el navegador no decide si un mail sale.

Presentación. React 18, Vite, Material UI, React Router y Axios. Hay dos árboles de rutas, `/admin` y `/alumno`, detrás de un control de sesión. El token JWT se guarda en el navegador y se manda en el encabezado Authorization. Si no hay token, cualquier ruta protegida vuelve al login.

Aplicación. Node.js y Express. Las carpetas separan rutas, controladores, modelos, middleware, servicios y el chat. La contraseña se guarda con bcrypt. El rol es `admin` o `alumno`. No hay un tercer rol.

Datos. MongoDB, accedido con Mongoose. En desarrollo la base se llama `tomi-alert`, en la máquina local. Las pruebas usan otra base, `tomi-alert-test`, para no borrar la demostración.

## Front end

El cliente corre en el puerto 5173. Vite proxea `/api` hacia el puerto 4000, así el navegador habla con un solo origen durante el desarrollo. En producción esa unión la resuelve la variable de origen permitido en el servidor, `CLIENT_ORIGIN`, y la URL pública de la API.

Las pantallas de administración son inicio, materias, mesas, notas, avisos y envíos. Las del alumno son inicio, notas, mesas, avisos y preferencias. El chat es un panel flotante, no una ruta. Así Tomi está en cualquier pantalla del alumno y no obliga a salir de la materia que se estaba mirando.

El front no formatea la verdad del negocio. Si el servidor dice que la nota no corresponde, la pantalla muestra el mensaje. Si el servidor dice que el envío fue omitido, la pantalla no lo pinta de verde.

## Back end

La API escucha en el puerto 4000. Al arrancar conecta la base y programa el cron de recordatorios a las 8, hora de Argentina. El mismo trabajo se puede disparar a mano desde el inicio de administración, porque en una defensa no se puede esperar al día siguiente.

Los controladores de avisos, notas y mesas no envían el correo ellos mismos, línea por línea. Llaman a un servicio de notificación. Ese servicio mira la preferencia del alumno. Si el mail está activo, intenta el envío y registra el resultado. Si está apagado, registra la omisión con un texto fijo: el alumno desactivó las notificaciones por email. Si Tomi está activo y el llamado trae un mensaje para el chat, lo agrega a la conversación. Reenviar un aviso no repite el chat. El mensaje proactivo ya se escribió.

Nodemailer arma el transporte. Si hay host SMTP, usa ese host. En el entorno de este proyecto el host es `smtp.gmail.com`, puerto 587, sin conexión segura implícita, con la cuenta dedicada. Si se define `SKIP_SMTP`, el envío no sale y el registro queda como simulado. Esa llave existe para las pruebas automáticas y para poder desarrollar sin escribirle a nadie.

## Base de datos

Las colecciones que importan son estas.

Usuarios. Nombre, documento, tipo de documento, correo, contraseña hasheada, rol y legajo. El legajo de los alumnos de demostración sigue la forma UIA7 y cuatro dígitos, por ejemplo UIA70035. El documento de administración es la cadena `admin`, no un DNI.

Materias. Código, nombre, año, orden, aula y horario. El horario se guarda en minúscula (“lunes y miércoles…”) para que Tomi pueda decir “se cursa lunes…”. La pantalla pone la mayúscula al mostrar.

Inscripciones. Alumno, materia, estado (`cursando` o `regular`) y si está inscripto a la mesa. Esa última marca solo importa cuando el estado es regular.

Notas. Alumno, materia, instancia (`parcial`, `recuperatorio` o `final`), valor de 0 a 10 y fecha de carga. El formulario ofrece las tres. La semilla usa parcial y final.

Mesas. Materia, tipo (`parcial` o `final`), fecha, límite de inscripción y aula.

Avisos. Título, cuerpo, tipo (`horario`, `aula` o `personalizado`), materia opcional, destinatarios y autor.

Preferencias. Mail activo y Tomi activo, por alumno.

Conversaciones y mensajes. Un hilo por alumno. Un mensaje de Tomi puede ser proactivo y llevar un tipo: aviso, nota, cambio de mesa o recordatorio.

Envíos. Alumno, aviso opcional, título, estado (`enviado`, `simulado`, `omitido` o `error`), detalle y cuerpo. Hay índices por fecha, por estado, por alumno y por aviso, porque el filtro de la pantalla consulta por esos campos.

## El motor de Tomi

El motor no llama a ningún servicio externo. Recibe el texto y el contexto del alumno: sus materias, sus notas, sus mesas y sus avisos.

Primero normaliza. Minúsculas, sin acentos, sin signos. “Fund. del Control de Calidad” y “fundamentos del control de calidad” se pueden comparar sin pelear con la tilde.

Después elige intención. Cada intención tiene palabras y una prioridad. Inscripción pesa más que final, porque “fecha límite del final” habla de anotarse, no de pedir la fecha suelta. Si no hay palabras conocidas, Tomi ofrece las opciones.

Si la intención necesita una materia y el mensaje no alcanza para elegir una sola, y el alumno tiene varias, Tomi pregunta y deja la intención pendiente. El turno siguiente, si el alumno contesta con el nombre, no tiene que repetir la pregunta. Si el alumno tiene una sola materia, Tomi la asume. Si nombra una materia en la que no está inscripto, lo dice.

Las respuestas son plantillas. Una nota se dice con la instancia y el valor. Una mesa se dice con la fecha, el aula y el límite. Un recordatorio de inscripción menciona la fecha límite. Nada de eso se redacta en el momento con un modelo. Por eso un test puede afirmar el texto completo.

## Carpetas y responsabilidades

El repositorio es un monorepo. En la raíz, un comando de desarrollo puede levantar el cliente y el servidor juntos. Cada uno también arranca solo. Esa separación se usó todo el ciclo: las pruebas del servidor no necesitan Vite, y el front se puede mirar aunque se esté tocando un controlador.

En `client` viven las pantallas, el marco con el menú, el buscador de alumnos y el chat flotante. No hay una carpeta de reglas de negocio. Si una pantalla necesita saber si el alumno está regular, le pregunta a la API.

En `server/src` el corte es el habitual de Express. `routes` declara el verbo y quién puede llamarlo. `controllers` lee el pedido y escribe la respuesta. `models` declara las colecciones. `services` concentra lo que no es de una sola pantalla: el correo, la notificación y el armado del contexto de Tomi. `chat` es el motor, sin Express y sin Mongoose. `middleware` revisa el token y el rol. `seed` carga la demostración y, si el proceso está en producción, se niega a borrar la base salvo que se lo pida a propósito.

Ese último freno existe porque el seed borra usuarios, materias, notas, avisos y mensajes antes de volver a crearlos. En la máquina de desarrollo es lo correcto. Contra Atlas, tiene que ser una decisión, no un efecto de arrancar el servidor.

## Catálogo de la API

Todos los recursos cuelgan de `/api`. El login es el único pedido de escritura que no lleva token. El resto pasa por `requireAuth`. Donde la tabla dice admin, un alumno recibe un rechazo. Donde dice alumno, administración no usa esa ruta: sus pantallas son otras.

| Método y ruta | Quién | Para qué |
| --- | --- | --- |
| GET /api/health | cualquiera | Responde que la API está viva. Sirve al publicar, antes de culpar al front. |
| POST /api/auth/login | cualquiera | Recibe documento y contraseña. Devuelve el token y el usuario, sin la clave. |
| GET /api/auth/me | sesión | Devuelve quién es el token. El front lo usa al recargar. |
| GET /api/careers | sesión | Lista la carrera. Hoy hay una: la tecnicatura. |
| GET /api/subjects | sesión | Lista el plan. El alumno no usa esta lista para ver materias ajenas: su inicio sale de sus inscripciones. |
| PUT /api/subjects/:id | admin | Cambia aula y horario. No crea materias nuevas. |
| GET /api/enrollments | sesión | Inscripciones. El alumno ve las suyas. |
| POST /api/enrollments | admin | Anota a un alumno en una materia. |
| PATCH /api/enrollments/:id | admin | Cambia cursando o regular, y la marca de mesa. |
| GET /api/students | admin | Devuelve los alumnos, con nombre, mail y legajo. El buscador de la pantalla no abre opciones hasta las dos letras y muestra como máximo ocho. |
| GET /api/exams | sesión | Fechas. El alumno ve las de sus materias. |
| POST /api/exams | admin | Crea una fecha y dispara el aviso. |
| PUT /api/exams/:id | admin | Edita la fecha y dispara el aviso con el dato nuevo. |
| DELETE /api/exams/:id | admin | Borra la fecha y avisa la cancelación. |
| GET /api/grades | sesión | Notas. El alumno solo ve las propias. |
| POST /api/grades | admin | Carga una nota de 0 a 10 a un alumno regular y notifica. |
| GET /api/stats | admin | Los números del inicio: alumnos, materias, avisos y envíos. |
| GET /api/notices | sesión | Avisos. El alumno ve los que lo tienen como destinatario. |
| POST /api/notices | admin | Publica un aviso de horario, aula o personalizado, y notifica. |
| POST /api/notices/:id/resend | admin | Vuelve a intentar el correo. No escribe otra vez en el chat. |
| GET /api/preferences | alumno | Lee las dos llaves, mail y Tomi. |
| PUT /api/preferences | alumno | Las cambia. El efecto es para el próximo aviso, no reescribe el pasado. |
| GET /api/chat | alumno | Mensajes del hilo, incluidos los proactivos. |
| POST /api/chat | alumno | Manda una frase. El motor responde y puede dejar una intención pendiente. |
| POST /api/chat/read | alumno | Marca leído, para que el botón deje de mostrar el aviso. |
| GET /api/mail-logs | admin | Envíos paginados, con estado, alumno, texto y rango de fechas. |
| POST /api/reminders/run | admin | Corre a mano el mismo trabajo que el cron de las 8. |

La respuesta de envíos no es un arreglo suelto. Es un objeto con `items`, `total`, `page` y `limit`. Si el cliente no pide límite, el servidor usa doscientos, que es lo que necesitan las pruebas. La pantalla pide cincuenta. El máximo aceptado es cien. Así la interfaz no puede pedir “todos” el día que la tabla deje de entrar en una página.

El texto de búsqueda se escapa antes de usarse como expresión regular. Un alumno que se llame con un punto o un paréntesis no rompe la consulta ni se convierte en un patrón. El rango de fechas se interpreta como día de Argentina, no como medianoche UTC, porque un envío de las nueve de la noche no tiene que caer en el día siguiente.

## Diccionario de datos

Los nombres de abajo son los de las colecciones. El identificador de Mongo no se lista: todas lo tienen, y las relaciones lo usan.

Usuarios. `name`, `document` único y en minúscula, `documentType` (`dni` o `pasaporte`), `email` único, `password` con hash, `role` (`admin` o `alumno`) y `legajo`. El documento de administración es la cadena `admin`. No es un DNI, y el login lo trata igual que a cualquier otro documento: lo busca y compara la clave.

Carrera. `name` y `code`. El código sembrado es TDCS.

Materias. `career`, `year` (1, 2 o 3), `order`, `code` en mayúscula, `name`, `classroom` y `schedule`. El horario se guarda como lo va a decir Tomi, en minúscula. La pantalla capitaliza al mostrar. El plan sembrado tiene veintiún materias: nueve de primer año, ocho de segundo y cuatro de tercero. No se dan de alta desde la interfaz.

Inscripciones. `student`, `subject`, `status` (`cursando` o `regular`) e `inscribedToExam`. La marca de mesa solo se interpreta cuando el estado es regular. Un alumno que cursa no está “inscripto a la mesa”: todavía no regularizó.

Notas. `student`, `subject`, `instance` (`parcial`, `recuperatorio` o `final`), `score` entre 0 y 10, y `loadedAt`. El controlador rechaza la carga si la inscripción no está regular. La semilla, que escribe directo en la colección para armar la demostración, no pasa por esa puerta. Por eso el recorrido de la defensa distingue “nota que ya vino con el seed” de “nota que cargó administración en la pantalla”.

Mesas. `subject`, `type` (`parcial` o `final`), `date`, `inscriptionDeadline` y `classroom`. El parcial de cursada puede no tener límite de inscripción. El final sí lo tiene en los datos de demostración, porque el recordatorio lo necesita.

Avisos. `title`, `body`, `type` (`horario`, `aula` o `personalizado`), `subject` opcional, `recipients` y `author`. No existe el tipo nota. Si alguien busca una calificación, está en la colección de notas.

Preferencias. `student` único, `emailEnabled` y `tomiEnabled`. Las dos nacen activas. La semilla apaga el mail de Luis, Lucía y Mateo, y apaga Tomi en María y en Mateo. El resto queda con los dos canales.

Conversación. `student` único y `pendingIntent`. Esa intención es la pregunta que Tomi hizo y todavía no respondieron: notas, parciales, u otra. Si llega un mensaje que ya nombra la materia, la intención se limpia.

Mensajes. `conversation`, `author` (`alumno` o `tomi`), `text`, `proactive`, `read` y `meta`. Un mensaje proactivo guarda en `meta` de qué se trata, para no repetir el mismo recordatorio de mesa. Reenviar un aviso no crea otro mensaje: el chat ya tiene el primero.

Envíos. `notice` opcional, `title`, `student`, `status`, `detail` y `body`. El estado es `enviado`, `simulado`, `omitido` o `error`. Hay índices por fecha, por estado y fecha, por alumno y fecha, y por aviso y fecha. El filtro de la pantalla usa esos campos. Sin índice, la consulta seguiría siendo correcta y dejaría de ser barata el día que la tabla crezca.

## Cómo sale una notificación

Conviene seguir un aviso de aula, porque es el caso que la defensa abre primero.

Administración completa título, texto, tipo Aula, carrera, año y materia, y publica. El controlador guarda el aviso con la lista de inscriptos de esa materia. Después llama al servicio de notificación, una vez por destinatario.

Para cada alumno el servicio mira la preferencia. Si no hay documento de preferencia, las dos llaves se toman como activas. Si el mail está apagado, no se intenta el envío: se registra `omitido` con el texto de que el alumno desactivó las notificaciones. Si el mail está activo y la variable `SKIP_SMTP` vale `true`, no sale nada a internet y el registro queda `simulado`. Si el mail está activo y hay un host configurado, se intenta el envío. Si el servidor acepta, el estado es `enviado` y el detalle guarda el identificador del mensaje. Si el servidor no se puede contactar, el estado no se pierde: queda `simulado`, y el detalle explica que no se pudo contactar y por qué. El valor `error` existe en el modelo y en el filtro de la pantalla, para poder distinguirlo el día que se decida marcarlo así. El camino de hoy, cuando falla la red, prefiere dejar la fila como simulada antes que no dejar fila.

Si no hay host y tampoco está `SKIP_SMTP`, Nodemailer abre una cuenta de prueba en un servicio desechable y manda el mensaje ahí. Eso sirve para mirar el correo en un laboratorio sin escribirle a nadie, y el registro queda `enviado` con una dirección de previsualización. No es el modo de la defensa ni el de las pruebas automáticas. Esas usan `SKIP_SMTP`. El destino real usa el SMTP de Gmail.

En el mismo paso, si Tomi está activo, se agrega un mensaje proactivo al hilo. Si Tomi está apagado, el hilo no se toca. María puede tener el mail en `simulado` o `enviado` y el chat en silencio. Luis puede tener el mail en `omitido` y el chat con el mensaje. Las dos combinaciones son el producto, no un caso raro.

La nota recorre el mismo servicio. Cambia el origen: no hay un aviso con tipo, hay una calificación. El texto del chat lo arma el motor, con la instancia y el valor. El de la mesa también: alta, edición o baja, con la fecha, el aula y el límite, o con la cancelación.

El recordatorio es el único que no nace de un botón de publicar, y también el único que no manda correo. A las 8, hora de Argentina, y también cuando administración pulsa el botón del inicio, se buscan finales cuyo límite de inscripción caiga entre ahora y los próximos siete días. Para cada uno se miran las inscripciones regulares que todavía no tienen la marca de mesa. Si Tomi está apagado, se saltea. Si el hilo ya tiene un mensaje con el identificador de esa mesa, se saltea. Si no, se escribe el texto del recordatorio y nada más. No aparece una fila en Envíos por este camino. El botón existe porque en una defensa no se puede esperar al día siguiente para mostrar el cron. Reenviar un aviso, en cambio, vuelve a recorrer el correo y no manda `tomiMeta`: por eso el chat no se duplica.

## Sesión

La contraseña no se guarda en claro. El seed y el alta usan bcrypt. El login compara contra el hash. Una clave mala no dice si falló el documento o la clave: alcanza con no entrar.

El token es un JWT. Viaja en el encabezado Authorization. El front lo guarda para no pedir la clave en cada pantalla. Si no está, la ruta protegida vuelve al login. El rol viaja en el usuario que devuelve el servidor, y las rutas de admin lo vuelven a mirar. Ocultar un botón no es la seguridad: un alumno que arme el pedido a mano recibe el rechazo igual.

En desarrollo, Vite recibe el navegador en el puerto 5173 y reenvía `/api` al puerto 4000. El navegador habla con un solo origen y no aparece un error de CORS en el día a día. En el destino publicado esa comodidad no está. `CLIENT_ORIGIN` tiene que ser la URL del front, y el front tiene que conocer la URL pública de la API. Si se publica uno y se olvida el otro, el síntoma es un panel que no carga, con la API sana. Por eso el capítulo de despliegue insiste en el orden.

Durante el desarrollo apareció un fallo que se parecía a este y no lo era. El proceso del servidor, al vigilar toda su carpeta, se reiniciaba la primera vez que una librería de codificación leía un archivo grande. El reinicio cortaba el primer pedido después del login y el panel decía que no podía traer los datos. Al actualizar, andaba, porque el archivo ya estaba leído. Se limitó la vigilancia a `server/src`. El primer ingreso dejó de cortarse. Queda contado acá, y no en el capítulo de negocio, porque no es una regla de la secretaría: es una regla de cómo se levanta el entorno.

## Las frases que Tomi puede decir

Cada intención tiene una plantilla. No hay un párrafo que se redacte en el momento. Si la defensa escucha otra oración, o el dato cambió o el motor no es el que se está ejecutando. Las frases de abajo son las del código. Los ejemplos usan a Martin Ferreyra, que cursa Desarrollo de Software y tiene Fund. del Control de Calidad regularizada, sin nota y sin inscripción a la mesa.

Saludo. Si el mensaje solo saluda, Tomi se presenta y lista lo que sabe hacer: fechas de parciales y finales, horarios, aulas, notas y avisos. No consulta la base para eso.

Ayuda. Responde que se le puede preguntar por parciales, finales, notas, horarios, aulas o por la inscripción, y avisa que si hay más de una materia hay que nombrarla.

Avisos. No pide materia. Lista hasta cinco títulos recientes. Si no hay, dice que no hay avisos nuevos. El cuerpo del aviso no se resume: el título alcanza para reconocer la novedad, y el texto completo está en la pantalla de Avisos.

Parciales. Si no hay uno cargado para esa materia, lo dice. Si hay, lista la fecha y, cuando existe, el aula. No mezcla los finales.

Finales. Lista la fecha, el aula y el límite de inscripción. Si no hay mesa, dice que no hay mesas de final cargadas. Un parcial no aparece en esta respuesta aunque la palabra “fecha” se parezca.

Inscripción. Acá la plantilla mira el estado, no solo la fecha. Si la materia se está cursando, Tomi dice que para anotarse hay que tenerla regularizada y repite el estado actual. Si está regularizada y no hay mesa, lo dice. Si está regularizada y ya figura inscripto, nombra la fecha de la mesa. Si está regularizada y no figura inscripto, nombra la mesa y el límite. Martin, sobre Fund. del Control de Calidad, cae en este último caso. Sobre Desarrollo de Software, cae en el primero, porque la está cursando.

Notas. Si no hay ninguna, la frase es “No tenés nota cargada en” y el nombre de la materia. Si hay, lista cada instancia con su valor. La instancia sale como está guardada, en minúscula: `parcial`, `recuperatorio` o `final`. Las tablas de la pantalla ponen la mayúscula. El chat no, porque la prueba automática compara el código. Martin, al preguntar por Desarrollo de Software, tiene que ver el parcial con 8. Al preguntar por Fund. del Control de Calidad, antes de que administración cargue una nota en el ensayo, tiene que oír que no hay nota.

Horario. “se cursa” y el texto guardado. Para Desarrollo de Software es lunes y miércoles de 18:00 a 20:00. Si el horario estuviera vacío, Tomi dice que no hay horario cargado, no inventa un día.

Aula. “se cursa en el aula” y el número. Desarrollo de Software es el aula 12. Fund. del Control de Calidad, en la semilla, es el aula 8, que es también el aula del aviso de demostración.

Cuando faltan datos para elegir. Si la intención necesita una materia, el alumno tiene varias y el mensaje no alcanza para una sola, Tomi pregunta “¿De qué materia?” y nombra las de la inscripción. Deja la intención pendiente. El turno siguiente, si el alumno contesta con el nombre, no tiene que repetir “quiero la nota”. Si nombra una materia en la que no está inscripto, la frase es “No estás inscripto en” ese nombre, y no se dice el aula ni la nota de un compañero. Si el nombre coincide con más de una materia suya, como Álgebra I y Álgebra II en otro alumno, pregunta “¿De cuál?” y ofrece solo esas.

Cuando no entiende. Un texto sin palabras conocidas no se adivina. La frase dice que no está seguro y ofrece parciales, finales, notas, horarios, aulas, inscripción y avisos. Las mismas seis respuestas rápidas del botón cubren el camino feliz sin escribir.

Los mensajes que Tomi escribe solo usan otras cuatro plantillas, y tampoco se improvisan.

Novedad. “Hay una novedad de” la materia, el título y el cuerpo. Si el aviso no tiene materia, se omite el “de”.

Nota cargada. “Se cargó una nota de” la instancia “en” la materia, y el valor. La instancia, otra vez, es el código.

Mesa creada. “Se creó un final de” o “un parcial de”, la fecha, el aula si hay, y el límite si es final.

Mesa modificada. “Se modificó el final” o “el parcial”, con la fecha nueva, el aula y el límite.

Mesa eliminada. “Se eliminó el final” o “el parcial”. El verbo cambia a pasado: el aula era, el límite era, estaba previsto para. No dice que la mesa sigue en pie.

Recordatorio. “Tenés” la materia “regularizada y todavía no figurás inscripto a la mesa. El límite de inscripción es el” día. “Conviene que te anotes antes de esa fecha.” Es la frase que Martin tiene en el chat cuando el límite de Fund. del Control de Calidad cae dentro de la ventana. No se manda por correo.

La prioridad entre palabras evita un equívoco concreto. Inscripción pesa más que final. “Me quiero inscribir al final” no devuelve la fecha suelta: devuelve el estado de la inscripción. Un saludo pegado a una consulta, “hola, qué nota tengo”, se lee como notas, porque la consulta suma más que el saludo. Si las dos palabras empatan en cantidad de coincidencias, gana la de mayor prioridad. Por eso el orden del arreglo de intenciones no es decorativo: es el desempate.

## Testing dentro de la arquitectura

Las pruebas del motor importan funciones puras. No levantan Express. Las pruebas de flujo levantan la aplicación contra `tomi-alert-test`, siembran los datos y recorren login, aviso, nota, cambio de mesa y recordatorio. Las dos suites se corren con `npm test` desde el servidor. El detalle de los casos está en el capítulo de testing.

El cliente no tiene una suite de interfaz automática. La verificación de pantallas se hizo en el navegador, sobre el recorrido de la defensa y sobre los filtros y los formularios que se fueron sumando. Esa decisión está dicha para que no se lea como un olvido.
