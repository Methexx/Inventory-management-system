import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import './index.css'

// index.html provides the root element before this module runs.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
