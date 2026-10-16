import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#0D47A1' },
    secondary: { main: '#F9A825' },
    background: { default: '#F4F6F8' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: { fontSize: '1.6rem' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  },
})

export default theme
