import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Theme initialization: localStorage > system preference
const initTheme = () => {
  const stored = localStorage.getItem('theme');

  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (stored === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // No user preference, use system
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
};

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

