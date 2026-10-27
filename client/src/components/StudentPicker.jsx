import { useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import { normalizeSearch } from '../utils'

const MIN_QUERY = 2
const MAX_RESULTS = 8

function labelOf(student) {
  return student?.legajo ? `${student.name} (${student.legajo})` : student?.name || ''
}

export default function StudentPicker({
  options,
  value,
  onChange,
  label = 'Alumno',
  disabled = false,
  helperText = ' ',
  required = false,
}) {
  const [input, setInput] = useState('')
  const selected = options.find((student) => student._id === value) || null
  const query = normalizeSearch(input.trim())

  return (
    <Autocomplete
      options={options}
      value={selected}
      disabled={disabled}
      onChange={(_event, student) => onChange(student?._id || '')}
      onInputChange={(_event, next) => setInput(next)}
      getOptionLabel={labelOf}
      isOptionEqualToValue={(option, current) => option._id === current._id}
      filterOptions={(list, state) => {
        const query = normalizeSearch(state.inputValue.trim())
        if (query.length < MIN_QUERY) return []
        return list
          .filter((student) => normalizeSearch(`${student.name} ${student.legajo || ''} ${student.email || ''}`).includes(query))
          .slice(0, MAX_RESULTS)
      }}
      noOptionsText={query.length < MIN_QUERY ? 'Escribí al menos dos letras del nombre o el legajo.' : 'Ningún alumno coincide.'}
      clearOnBlur
      handleHomeEndKeys
      sx={{ minWidth: 280, flex: 1 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          helperText={helperText}
        />
      )}
    />
  )
}
