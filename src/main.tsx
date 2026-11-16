import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

// No StrictMode: its dev-only double effects would double-run the preloader's asset promises.
createRoot(document.getElementById('root')!).render(<App />)
