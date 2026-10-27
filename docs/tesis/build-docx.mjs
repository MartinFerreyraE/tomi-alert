import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'

const root = path.dirname(fileURLToPath(import.meta.url))
const chapters = [
  '01-agradecimiento.md',
  '02-resumen.md',
  '03-introduccion.md',
  '04-equipo.md',
  '05-diseno.md',
  '06-planificacion.md',
  '07-arquitectura.md',
  '08-ejecucion.md',
  '09-testing.md',
  '10-metricas.md',
  '11-despliegue.md',
  '12-conclusiones.md',
  '13-anexos.md',
]

const FONT = 'Calibri'
const NAVY = '0D47A1'
const CONTENT = 9070
const thin = { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' }
const borders = { top: thin, bottom: thin, left: thin, right: thin }
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

let figure = 0

function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function fit(width, height) {
  const scale = Math.min(600 / width, 680 / height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function runs(text, options = {}) {
  const size = options.size || 24
  const font = options.font || FONT
  const color = options.color
  const parts = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let match
  const push = (value, extra = {}) => {
    if (!value) return
    parts.push(new TextRun({
      text: value,
      font: extra.font || font,
      size: extra.size || size,
      bold: extra.bold || options.bold || false,
      italics: extra.italics || options.italics || false,
      color: extra.color || color,
    }))
  }
  while ((match = re.exec(text))) {
    push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('**')) push(token.slice(2, -2), { bold: true })
    else push(token.slice(1, -1), { font: 'Consolas', size: Math.max(18, size - 2) })
    last = match.index + token.length
  }
  push(text.slice(last))
  if (!parts.length) push('')
  return parts
}

function paragraph(text, options = {}) {
  return new Paragraph({
    alignment: options.align || AlignmentType.JUSTIFIED,
    spacing: { before: options.before || 0, after: options.after ?? 240, line: options.line || 530 },
    children: runs(text, options),
  })
}

function heading(text, level) {
  const map = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 }
  const size = { 1: 32, 2: 26, 3: 24 }[level]
  return new Paragraph({
    heading: map[level],
    pageBreakBefore: level === 1,
    spacing: { before: level === 1 ? 0 : 280, after: 160, line: 276 },
    children: [new TextRun({ text, font: FONT, size, bold: true, color: level === 1 ? NAVY : '1A1A1A' })],
  })
}

function columnWidths(headers) {
  const joined = headers.join(' ').toLowerCase()
  const count = headers.length
  if (joined.includes('horario') && count === 5) return [700, 1100, 2700, 800, 3770]
  if (joined.includes('carry') && count === 6) return [900, 2500, 1400, 1300, 1500, 1470]
  if (joined.includes('método') || joined.includes('metodo')) return [2800, 1400, 4870]
  if (joined.startsWith('variable')) return [1800, 2800, 4470]
  if (joined.startsWith('prueba')) return [3400, 5670]
  if (joined.includes('sprint') && count === 6) return [900, 2500, 1400, 1300, 1500, 1470]
  const each = Math.floor(CONTENT / count)
  return Array.from({ length: count }, (_, index) => (index === count - 1 ? CONTENT - each * (count - 1) : each))
}

function cell(text, width, header) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    shading: header ? { type: ShadingType.CLEAR, fill: 'E3F2FD' } : undefined,
    children: [new Paragraph({
      spacing: { before: 20, after: 20, line: 276 },
      children: runs(text, { size: 20, bold: header }),
    })],
  })
}

function table(rows) {
  const parsed = rows
    .map((row) => row.split('|').slice(1, -1).map((cellText) => cellText.trim()))
    .filter((row) => row.length && !row.every((cellText) => /^:?-+:?$/.test(cellText)))
  if (!parsed.length) return paragraph('')
  const widths = columnWidths(parsed[0])
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: widths,
    rows: parsed.map((row, index) => new TableRow({
      tableHeader: index === 0,
      cantSplit: true,
      children: row.map((value, cellIndex) => cell(value, widths[cellIndex] || widths[widths.length - 1], index === 0)),
    })),
  })
}

function imageBlock(alt, src) {
  const file = path.resolve(root, src)
  if (!fs.existsSync(file)) {
    return paragraph(`Figura pendiente: ${alt} (${src})`, { italics: true })
  }
  const data = fs.readFileSync(file)
  const size = fit(pngSize(data).width, pngSize(data).height)
  figure += 1
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new ImageRun({
        type: 'png',
        data,
        transformation: size,
        altText: { title: alt, description: alt, name: `figura-${figure}` },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 240 },
      children: [new TextRun({ text: `Figura ${figure}. ${alt}`, italics: true, font: FONT, size: 20, color: '444444' })],
    }),
  ]
}

function parse(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }
    if (line.startsWith('```')) {
      const code = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      blocks.push(new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: 'F4F5F7' },
        spacing: { before: 80, after: 160, line: 276 },
        children: [new TextRun({ text: code.join('\n') || ' ', font: 'Consolas', size: 18 })],
      }))
      continue
    }
    if (line.startsWith('|')) {
      const rows = []
      while (index < lines.length && lines[index].startsWith('|')) {
        rows.push(lines[index])
        index += 1
      }
      blocks.push(table(rows))
      blocks.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
      continue
    }
    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (image) {
      blocks.push(...[].concat(imageBlock(image[1], image[2])))
      index += 1
      continue
    }
    const title = line.match(/^(#{1,3})\s+(.*)$/)
    if (title) {
      blocks.push(heading(title[2], title[1].length))
      index += 1
      continue
    }
    if (line.startsWith('- ')) {
      while (index < lines.length && lines[index].startsWith('- ')) {
        blocks.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 420 },
          spacing: { after: 100, line: 530 },
          children: runs(`• ${lines[index].slice(2)}`),
        }))
        index += 1
      }
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      let number = 1
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        blocks.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 420 },
          spacing: { after: 100, line: 530 },
          children: runs(`${number}. ${lines[index].replace(/^\d+\.\s/, '')}`),
        }))
        number += 1
        index += 1
      }
      continue
    }
    const text = [line.trim()]
    index += 1
    while (
      index < lines.length
      && lines[index].trim()
      && !lines[index].startsWith('#')
      && !lines[index].startsWith('|')
      && !lines[index].startsWith('- ')
      && !lines[index].startsWith('```')
      && !lines[index].startsWith('![')
      && !/^\d+\.\s/.test(lines[index])
    ) {
      text.push(lines[index].trim())
      index += 1
    }
    blocks.push(paragraph(text.join(' ')))
  }
  return blocks
}

function coverLine(text, options = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: options.before || 0, after: options.after || 0, line: 276 },
    children: [new TextRun({
      text,
      font: FONT,
      size: options.size || 24,
      bold: Boolean(options.bold),
      color: options.color || '1A1A1A',
      italics: Boolean(options.italics),
    })],
  })
}

function pageFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'D0D7DE', space: 8 } },
      spacing: { before: 80 },
      children: [
        new TextRun({ text: 'Tomi-Alert  ·  Proyecto Final  ·  ', font: FONT, size: 18, color: '666666' }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '666666' }),
      ],
    })],
  })
}

function pageHeader() {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D0D7DE', space: 6 } },
      spacing: { after: 80 },
      children: [new TextRun({ text: 'UNSTA  ·  Facultad de Ingeniería', font: FONT, size: 16, color: '888888', italics: true })],
    })],
  })
}

const page = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1300, bottom: 1300, left: 1418, right: 1418, header: 500, footer: 560 },
}

const body = []
for (const file of chapters) {
  body.push(...parse(fs.readFileSync(path.join(root, file), 'utf8')))
}

const doc = new Document({
  creator: 'Enzo Martín Ferreyra',
  title: 'Tomi-Alert. Proyecto Final',
  description: 'Proyecto Final de la Tecnicatura Universitaria en Desarrollo y Calidad de Software. UNSTA, 2026.',
  features: { updateFields: true },
  styles: {
    default: {
      document: {
        styles: [{
          id: 'Normal',
          run: { font: FONT, size: 24 },
          paragraph: { spacing: { line: 360, after: 200 } },
        }],
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickStyle: true,
        paragraph: { outlineLevel: 0, spacing: { before: 0, after: 200, line: 276 } },
        run: { font: FONT, size: 32, bold: true, color: NAVY },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickStyle: true,
        paragraph: { outlineLevel: 1, spacing: { before: 280, after: 140, line: 276 } },
        run: { font: FONT, size: 26, bold: true, color: '1A1A1A' },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickStyle: true,
        paragraph: { outlineLevel: 2, spacing: { before: 200, after: 120, line: 276 } },
        run: { font: FONT, size: 24, bold: true, color: '1A1A1A' },
      },
    ],
  },
  sections: [
    {
      properties: { page },
      children: [
        coverLine('Universidad del Norte Santo Tomás de Aquino', { size: 28, bold: true, color: NAVY, before: 600, after: 80 }),
        coverLine('Facultad de Ingeniería', { size: 24, after: 40 }),
        coverLine('Tecnicatura Universitaria en Desarrollo y Calidad de Software', { size: 24, after: 500 }),
        coverLine('PROYECTO FINAL', { size: 28, bold: true, before: 200, after: 280 }),
        coverLine('Tomi-Alert', { size: 56, bold: true, color: NAVY, before: 200, after: 160 }),
        coverLine('Avisos académicos, en el mail y en el chat', { size: 26, italics: true, after: 700 }),
        coverLine('Autor', { size: 20, color: '666666', before: 400, after: 40 }),
        coverLine('Enzo Martín Ferreyra', { size: 28, bold: true, after: 500 }),
        coverLine('2026', { size: 28, bold: true, before: 200 }),
      ],
    },
    {
      properties: { page },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 200 },
          children: [new TextRun({ text: 'Contenido', font: FONT, size: 32, bold: true, color: NAVY })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({
            text: 'Si esta lista aparece vacía al abrir el archivo, hacé clic derecho sobre ella y elegí Actualizar campos.',
            italics: true,
            font: FONT,
            size: 20,
            color: '666666',
          })],
        }),
        new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
        ...body,
      ],
    },
  ],
})

const out = path.resolve(root, '..', 'Tomi-Alert-Proyecto-Final.docx')
const buffer = await Packer.toBuffer(doc)
fs.writeFileSync(out, buffer)
console.log(`Escrito ${out} (${buffer.length} bytes, ${figure} figuras)`)
