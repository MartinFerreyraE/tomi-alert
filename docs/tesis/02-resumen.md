# Resumen ejecutivo

Tomi-Alert es una aplicación web para la Tecnicatura en Desarrollo y Calidad de Software. El personal administrativo publica avisos de horario, de aula o un mensaje personalizado. El aviso llega a los alumnos inscriptos en una materia, o a una lista puntual. Cada alumno recibe el correo si tiene el mail activo, lo ve en su panel y, si tiene los mensajes activos, también lo encuentra en el chat de Tomi.

Tomi no es un modelo de lenguaje. Es un motor de reglas. Lee el mensaje, lo pasa a minúsculas, le saca los acentos y elige una intención por palabras clave: saludo, ayuda, parciales, finales, horarios, aulas, notas, inscripción o avisos. Después busca la materia por nombre o por código. Si el alumno cursa varias y no nombra ninguna, Tomi pregunta y guarda la intención para el turno siguiente. Si cursa una sola, la asume. Si no está inscripto, lo dice. Si no hay nota, responde que no hay nota cargada. La respuesta sale de los datos de ese alumno, no de un texto genérico.

El mismo criterio se usa cuando la administración carga una nota, o cuando crea, edita o borra una mesa o un parcial. El alumno con el mail activo recibe el correo. El alumno con Tomi activo recibe el mensaje en el chat. Si una vía está apagada, no se fuerza: el mail queda registrado como omitido y el chat no escribe. Esa decisión queda en Envíos, para poder mostrarla.

El trabajo se organizó con Scrum, en un equipo de una persona. Entre el 2 de marzo y el 19 de junio de 2026 se cerraron ocho sprints de dos semanas. El tablero se llevó en Trello, con las columnas Backlog, Bloqueado, Por hacer, En curso, Listo para prueba y Hecho. La capacidad de partida fue de 13 a 20 puntos por sprint. El sprint 0, de preparación, se planificó en 8 puntos. El sprint 7, de cierre del informe, también.

La calidad que se defiende no es un porcentaje sobre toda la interfaz. Se defiende el motor de reglas, con pruebas automáticas, y un recorrido de punta a punta: un aviso de aula en Fundamentos del Control de Calidad, una nota, y el recordatorio de mesa para quien está regular y todavía no se inscribió. Ese recorrido se puede repetir con los datos de demostración.

El producto está preparado para publicarse en tres servicios. El front, hecho con React y Vite, tiene como destino Vercel. La API, hecha con Node.js y Express, tiene como destino Render. La base, MongoDB, tiene como destino Atlas. En esta entrega esas direcciones se documentan como el despliegue previsto. La aplicación que se muestra en las figuras corre en el entorno local de desarrollo.

# Acrónimos

- API. Application Programming Interface. En este trabajo, los recursos HTTP bajo `/api`.
- CRUD. Create, Read, Update, Delete. Alta, lectura, modificación y baja.
- DNI. Documento Nacional de Identidad. Junto con el pasaporte, es el dato con el que ingresa un alumno.
- JWT. JSON Web Token. Credencial que el servidor firma después del login y que el navegador envía en cada pedido.
- MERN. MongoDB, Express, React y Node.js. Es la familia de tecnologías de Tomi-Alert, con Vite y Material UI en el front.
- MVP. Minimum Viable Product. El recorte que se puede usar y defender, sin la autogestión real de la facultad.
- Scrum. Marco de trabajo con sprints, tablero, review y retrospectiva.
- SMTP. Simple Mail Transfer Protocol. Protocolo con el que sale el correo.
- SPA. Single Page Application. La interfaz cambia de pantalla sin recargar todo el sitio.
- Mesa. Instancia de final, con fecha, aula y límite de inscripción.
- Regular. Estado de una cursada ya regularizada. Solo en ese estado se puede cargar una nota y tiene sentido hablar de inscripción a la mesa.
