import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clear legacy mock localStorage items from previous test sessions
const LEGACY_MOCK_KEYS = ['meditrack_pending_prescriptions', 'meditrack_conflicts', 'meditrack_patient_doses', 'meditrack_escalations_v2'];
if (!localStorage.getItem('meditrack_v2_live_cleaned')) {
  LEGACY_MOCK_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.setItem('meditrack_v2_live_cleaned', 'true');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
