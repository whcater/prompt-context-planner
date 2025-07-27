# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Prompt Context Planner** - an intelligent project planning tool that supports multiple AI services for analyzing project requirements and generating detailed development step prompts. The application consists of a React frontend and an Express.js proxy server to handle CORS and AI API integration.

## Development Commands

```bash
# Quick start (recommended)
# Windows: start.bat
# Mac/Linux: bash start.sh

# Manual development setup
npm install                    # Install dependencies
npm run server                 # Start proxy server (port 3001)
npm run dev                    # Start frontend dev server (port 3000)

# Build and preview
npm run build                  # Build for production
npm run preview                # Preview production build

# Individual services
npm start                      # Alias for npm run server
```

## Architecture Overview

### Dual Server Architecture
- **Frontend Server** (Vite): Port 3000 - React application with hot reload
- **Proxy Server** (Express): Port 3001 - API proxy to handle CORS and AI service integration

### Core Components Structure
```
src/
├── main.jsx                           # React entry point
├── claude_integrated_planner.jsx      # Main application component (single large component)
└── index.css                          # Tailwind CSS + custom styles
```

### AI Service Integration
The application integrates with multiple AI providers through a unified proxy:
- **Claude (Anthropic)**: claude-3-sonnet-20240229, claude-3-opus-20240229
- **OpenAI**: gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo, gpt-4o  
- **xAI (Grok)**: grok-4-0709, grok-3
- **DeepSeek**: deepseek-chat, deepseek-coder

## Key Technical Patterns

### CORS Handling Strategy
The project uses a **dual CORS solution**:
1. **Express Proxy Server** (`proxy_server.js`): Handles AI API calls with comprehensive CORS headers
2. **Vite Proxy Configuration**: Fallback `/api` routing from frontend to proxy server

### Component Architecture
- **Single Large Component**: The main application logic is contained in `claude_integrated_planner.jsx` 
- **React Hooks Pattern**: Uses useState for state management (no external state library)
- **Lucide React Icons**: For consistent iconography throughout the UI

### API Request Flow
```
Frontend (port 3000) → Vite Proxy → Express Server (port 3001) → AI APIs
```

The frontend attempts to use Vite's built-in proxy first, then falls back to direct calls to the Express proxy server.

### State Management Patterns
Key state variables in the main component:
- `userInput`: Project requirements input
- `apiKey`: AI service API key (not persisted)
- `aiProvider`: Selected AI service provider
- `currentPlan`: Generated development plan object
- `expandedSteps`: UI state for collapsible step sections
- `isAnalyzing`: Loading state for AI requests

## Development Environment Setup

### Prerequisites
- Node.js 16+
- Modern browser with ES6+ support

### Port Configuration
- **Frontend**: 3000 (Vite dev server)
- **Proxy**: 3001 (Express API proxy)
- **CORS Origins**: Supports localhost:3000, localhost:3002, localhost:5173, 127.0.0.1:3000

### Environment Variables
Create `.env` file for proxy configuration:
- `HTTP_PROXY` / `HTTPS_PROXY`: Optional proxy settings for corporate networks
- `PORT`: Proxy server port (defaults to 3001)

## CORS Troubleshooting

### Common Issues and Solutions
1. **"CORS policy blocked"**: Ensure proxy server is running on port 3001
2. **"Failed to fetch"**: Check proxy server health at `http://localhost:3001/health`
3. **Port conflicts**: Kill existing node processes or change port configuration

### Proxy Server Endpoints
- `POST /api/ai/{provider}`: Universal AI API proxy endpoint
- `GET /health`: Server health check and supported providers
- `GET /api/providers`: List available AI service configurations

## Code Conventions

### React Patterns
- Functional components with hooks
- Props destructuring in function parameters
- JSX fragments (`<>`) preferred over wrapper divs
- Tailwind CSS classes for styling

### ES Module Usage
- All files use ES6 import/export syntax
- `"type": "module"` in package.json
- Modern async/await patterns for API calls

### Error Handling
- Comprehensive try-catch blocks for AI API calls
- User-friendly error messages with technical details
- Network connectivity diagnostics included

## Build and Deployment Notes

### Vite Configuration
- React plugin enabled
- Custom port (3000) and host (127.0.0.1) configuration
- API proxy fallback to Express server
- Source maps enabled for debugging

### Production Build
- Output directory: `dist/`
- Source maps included
- Global polyfill for Node.js compatibility

## Security Considerations

- API keys are only stored in component state (not persisted)
- CORS strictly configured for known origins
- Express proxy validates request parameters
- No sensitive data logged or committed