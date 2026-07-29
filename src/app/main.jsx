import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@material-tailwind/react';
import { BrowserRouter } from 'react-router-dom'

import { ColorModeProvider } from '../shared/context/ColorModeContext.jsx';

import '../styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeProvider>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeProvider>
  </StrictMode>,
)
