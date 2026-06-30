import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'

// Map the deployed hostnames to GlitchTip environments. Returns null for
// localhost so errors from local dev aren't reported.
const sentryEnvironment =
  window.location.hostname === 'attendance.tsteil.com' ? 'production'
  : window.location.hostname === 'attendance-dev.tsteil.com' ? 'development'
  : null

if (sentryEnvironment) {
  Sentry.init({
    dsn: 'https://1d241d52e5c248408657ff2f06defee6@logs.tsteil.com/8',
    environment: sentryEnvironment,
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Sentry.ErrorBoundary fallback={<p style={{ padding: 24 }}>Something went wrong. Please refresh the page.</p>}>
        <App />
      </Sentry.ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)
