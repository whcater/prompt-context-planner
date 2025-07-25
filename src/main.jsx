import React from 'react'
import { createRoot } from 'react-dom/client'
import ClaudeIntegratedPlanner from './claude_integrated_planner'
import './index.css'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <ClaudeIntegratedPlanner />
  </React.StrictMode>
)