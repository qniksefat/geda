import { createTheme } from '@mui/material/styles';

// Custom color palette based on the suggested theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1A9CB0', // Teal Blue - Main brand color
      light: '#4DB6C6',
      dark: '#0B6475',
      contrastText: '#fff',
    },
    secondary: {
      main: '#7B68EE', // Royal Purple - For secondary elements
      light: '#9A8CF1',
      dark: '#5A48B0',
      contrastText: '#fff',
    },
    error: {
      main: '#E83A3A', // Crimson Red - For negative financial indicators (expenses)
      light: '#F26767',
      dark: '#B81E1E',
    },
    warning: {
      main: '#FFD166', // Soft Yellow - For notifications and alerts
      light: '#FFDD8A',
      dark: '#D9A840',
    },
    info: {
      main: '#E6E6FA', // Light Lavender - For background elements and cards
      light: '#EEEEFF',
      dark: '#C2C2D6',
    },
    success: {
      main: '#3AE374', // Mint Green - For positive financial indicators (income)
      light: '#64E992',
      dark: '#27B054',
    },
    action: {
      active: '#FF7F50', // Coral Orange - For CTAs and important actions
      hover: '#FF9972',
      hoverOpacity: 0.1,
      selected: '#FF6633',
      disabled: '#7A8C98',
      disabledBackground: '#E6E6FA',
    },
    text: {
      primary: '#2D3436', // Charcoal - For primary text
      secondary: '#7A8C98', // Slate Gray - For secondary text and icons
      disabled: '#A9B6C0',
    },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF',
    },
    divider: '#E6E6FA',
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: '#1A9CB0',
          '&:hover': {
            backgroundColor: '#0B6475',
          },
        },
        containedSecondary: {
          backgroundColor: '#FF7F50', // Coral Orange for CTA buttons
          '&:hover': {
            backgroundColor: '#FF6633',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;