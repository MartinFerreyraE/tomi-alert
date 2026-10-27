import fs from 'node:fs'

const css = `
  body { margin: 0; font-family: "Segoe UI", sans-serif; background: #f4f5f7; color: #172b4d; width: 1320px; }
  header { background: #0d47a1; color: white; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; }
  header h1 { margin: 0; font-size: 18px; }
  header span { font-size: 13px; opacity: .9; }
  .board { display: flex; gap: 8px; padding: 12px; align-items: flex-start; }
  .col { background: #ebecf0; border-radius: 8px; width: 206px; padding: 6px; }
  .col h2 { font-size: 12px; margin: 4px 6px 8px; }
  .card { background: white; border-radius: 6px; padding: 4px 7px 5px; margin-bottom: 3px; box-shadow: 0 1px 0 rgba(9,30,66,.13); }
  .card b { display: block; font-size: 12px; line-height: 1.15; }
  .pts { display: inline-block; margin-top: 3px; background: #deebff; color: #0747a6; border-radius: 8px; padding: 0 7px; font-size: 11px; font-weight: 700; }
`

const stories = {
  'TA-00': ['TA-00 Esqueleto', 'Modelo, semilla y sin modelo de lenguaje.', '8'],
  'TA-01': ['TA-01 Login', 'Documento, rol y panel que corresponde.', '5'],
  'TA-02': ['TA-02 Mis materias', 'Horario, aula y estado de cursada.', '5'],
  'TA-03': ['TA-03 Carga académica', 'Aula, mesas, inscriptos y notas.', '8'],
  'TA-04': ['TA-04 Avisos', 'Horario, aula o un mensaje puntual.', '5'],
  'TA-05': ['TA-05 Preferencias', 'Encender o apagar mail y Tomi.', '5'],
  'TA-06': ['TA-06 Tomi', 'Consultas con los datos del alumno.', '8'],
  'TA-07': ['TA-07 Recordatorios', 'Aviso de novedad y de mesa.', '8'],
  'TA-08': ['TA-08 Cambio de mesa', 'Crear, editar o borrar avisa.', '5'],
  'TA-09': ['TA-09 Filtro de envíos', 'Estado, alumno, texto y fecha.', '3'],
  'TA-10': ['TA-10 Despliegue', 'Dejar escrito Vercel, Render y Atlas.', '3'],
  marco: ['Marco del panel', 'Menú, nombre y cierre de sesión.', '3'],
  mesa: ['Aviso al cambiar mesa', 'La inscripción todavía no avisa.', '3'],
  proactivos: ['Mensajes proactivos', 'Primer tramo, se cierra en el sprint 6.', '2'],
}

const columns = ['Backlog', 'Bloqueado', 'Por hacer', 'En curso', 'Listo para prueba', 'Hecho']

function card(key) {
  const [title, text, points] = stories[key]
  return `<div class="card"><b>${title}</b><span class="pts">${points}</span></div>`
}

function page(file, subtitle, placed) {
  const cols = columns.map((name) => {
    const keys = placed[name] || []
    return `<div class="col"><h2>${name}</h2>${keys.map(card).join('')}</div>`
  }).join('')
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${subtitle}</title><style>${css}</style></head><body>
<header><h1>Tomi-Alert</h1><span>Trello · ${subtitle}</span></header>
<div class="board">${cols}</div>
</body></html>`
  fs.writeFileSync(new URL(file, import.meta.url), html)
}

const rest = (...keys) => keys

page('inicio.html', 'Inicio del ciclo · 2 de marzo de 2026', {
  Backlog: ['TA-00', 'TA-01', 'TA-02', 'TA-03', 'TA-04', 'TA-05', 'TA-06', 'TA-07', 'TA-08', 'TA-09', 'TA-10'],
})

page('s0.html', 'Cierre del sprint 0 · 13 de marzo de 2026', {
  Backlog: ['TA-01', 'TA-02', 'TA-03', 'TA-04', 'TA-05', 'TA-06', 'TA-07', 'TA-08', 'TA-09', 'TA-10'],
  Hecho: ['TA-00'],
})

page('s1.html', 'Cierre del sprint 1 · 27 de marzo de 2026', {
  Backlog: ['TA-04', 'TA-05', 'TA-06', 'TA-07', 'TA-08', 'TA-09', 'TA-10'],
  'Por hacer': ['TA-02', 'TA-03', 'marco'],
  Hecho: ['TA-00', 'TA-01'],
})

page('s2.html', 'Cierre del sprint 2 · 10 de abril de 2026', {
  Backlog: ['TA-05', 'TA-06', 'TA-07', 'TA-08', 'TA-09', 'TA-10'],
  'Por hacer': ['TA-04', 'mesa'],
  Hecho: ['TA-00', 'TA-01', 'TA-02', 'TA-03'],
})

page('s3.html', 'Cierre del sprint 3 · 24 de abril de 2026', {
  Backlog: ['TA-06', 'TA-07', 'TA-08', 'TA-09', 'TA-10'],
  'Por hacer': ['TA-05', 'mesa'],
  Hecho: ['TA-00', 'TA-01', 'TA-02', 'TA-03', 'TA-04'],
})

page('s4.html', 'Cierre del sprint 4 · 8 de mayo de 2026', {
  Backlog: ['TA-06', 'TA-07', 'TA-08', 'TA-10'],
  'Por hacer': ['TA-09', 'mesa'],
  Hecho: ['TA-00', 'TA-01', 'TA-02', 'TA-03', 'TA-04', 'TA-05'],
})

page('s5.html', 'Cierre del sprint 5 · 22 de mayo de 2026', {
  Backlog: ['TA-08', 'TA-10'],
  'Por hacer': ['TA-09'],
  'En curso': ['TA-07'],
  Hecho: ['TA-00', 'TA-01', 'TA-02', 'TA-03', 'TA-04', 'TA-05', 'TA-06'],
})

page('s6.html', 'Cierre del sprint 6 · 5 de junio de 2026', {
  'En curso': ['TA-10'],
  Hecho: ['TA-00', 'TA-01', 'TA-02', 'TA-03', 'TA-04', 'TA-05', 'TA-06', 'TA-07', 'TA-08', 'TA-09'],
})
