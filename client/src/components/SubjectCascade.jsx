import { MenuItem, Stack, TextField } from '@mui/material'

export const YEAR_LABELS = {
  1: 'Primer Año',
  2: 'Segundo Año',
  3: 'Tercer Año',
}

export default function SubjectCascade({ careers, subjects, value, onChange, requireSubject = true }) {
  const careerId = value.careerId || ''
  const year = value.year || ''
  const subjectId = value.subjectId || ''
  const filtered = subjects.filter((subject) => {
    const subjectCareer = subject.career?._id || subject.career
    return String(subjectCareer) === String(careerId) && String(subject.year) === String(year)
  })

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
      <TextField
        select
        label="Carrera"
        value={careerId}
        onChange={(event) => onChange({ careerId: event.target.value, year: '', subjectId: '' })}
        sx={{ minWidth: 260, flex: 1.4 }}
        required
      >
        {careers.map((career) => <MenuItem key={career._id} value={career._id}>{career.name}</MenuItem>)}
      </TextField>
      <TextField
        select
        label="Año"
        value={year}
        onChange={(event) => onChange({ careerId, year: event.target.value, subjectId: '' })}
        sx={{ minWidth: 160 }}
        disabled={!careerId}
        required
      >
        {[1, 2, 3].map((item) => <MenuItem key={item} value={String(item)}>{YEAR_LABELS[item]}</MenuItem>)}
      </TextField>
      <TextField
        select
        label="Materia"
        value={subjectId}
        onChange={(event) => onChange({ careerId, year, subjectId: event.target.value })}
        sx={{ minWidth: 240, flex: 1 }}
        disabled={!year}
        required={requireSubject}
      >
        {filtered.map((subject) => <MenuItem key={subject._id} value={subject._id}>{subject.name}</MenuItem>)}
      </TextField>
    </Stack>
  )
}
