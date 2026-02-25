import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
if (!root) throw new Error('#root element not found')

try {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  root.innerHTML = `<div style="padding:20px;font-family:sans-serif;color:#333"><h2>앱 로드 오류</h2><pre>${err?.message || err}</pre></div>`
  console.error(err)
}
