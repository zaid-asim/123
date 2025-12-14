# Swadesh AI - Indian-Themed AI Assistant

## Project Overview
Swadesh AI is a premium Indian-themed AI assistant and search engine with advanced animations, voice capabilities, and comprehensive AI tools. Built with React + Express + Gemini AI integration.

**Creator**: Zaid Asim
**Tagline**: Built in India • For the World

## Tech Stack
- **Frontend**: React + TypeScript + TailwindCSS + Shadcn/UI
- **Backend**: Express.js + Node.js
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Custom Indian tricolor theme with glassmorphism

## Project Structure

```
client/
├── src/
│   ├── components/       # Shared UI components
│   │   ├── particle-background.tsx  # Animated particle effect
│   │   ├── swadesh-logo.tsx         # Animated logo component
│   │   ├── theme-toggle.tsx         # Dark/light mode toggle
│   │   ├── tool-card.tsx            # Animated tool cards
│   │   └── ui/                      # Shadcn components
│   ├── lib/              # Context providers and utilities
│   │   ├── theme-provider.tsx       # Theme context
│   │   ├── settings-context.tsx     # App settings
│   │   ├── music-context.tsx        # Music player state
│   │   └── tts-context.tsx          # Text-to-speech
│   ├── pages/            # Route pages
│   │   ├── home.tsx                 # Landing page
│   │   ├── chat.tsx                 # AI chat interface
│   │   ├── settings.tsx             # Settings panel
│   │   ├── music.tsx                # Music player
│   │   ├── productivity.tsx         # To-do, notes, reminders
│   │   ├── search.tsx               # AI-powered search
│   │   ├── daily.tsx                # Daily quotes and facts
│   │   └── tools/                   # AI tool pages
│   │       ├── document.tsx         # Document Master
│   │       ├── code.tsx             # Code AI Lab
│   │       ├── study.tsx            # Study Pro Suite
│   │       ├── language.tsx         # Language Converter
│   │       ├── voice.tsx            # Voice Operations
│   │       ├── image.tsx            # Image Vision
│   │       └── creative.tsx         # Creative Tools
│   └── App.tsx           # Main app with routing
server/
├── gemini.ts             # Gemini AI integration
├── routes.ts             # API routes
├── storage.ts            # Storage interface
└── index.ts              # Express server
shared/
└── schema.ts             # Shared types and Zod schemas
```

## Key Features

### AI Capabilities
- **Chat**: Natural conversation with Gemini 2.5 Flash
- **Document Master**: PDF reader, summarizer, translator
- **Code AI Lab**: Code generation, debugging, optimization
- **Study Pro Suite**: NCERT solutions, MCQ generator, math solver
- **Language Converter**: Multi-language translation (Hindi, Tamil, Telugu, Bengali)
- **Voice Operations**: Speech-to-text and text-to-speech
- **Image Vision**: OCR, object detection, scene analysis
- **Creative Tools**: Script, story, poem generator

### UI Features
- Indian tricolor theme (saffron, white, green)
- Glassmorphism effects
- Animated particle background
- Neon glow effects
- Responsive design

### Personality Modes
- Formal: Professional responses
- Friendly: Warm and conversational
- Professional: Business-focused
- Teacher: Educational style
- DC Mode: Government-grade formal (for officials)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main chat with AI |
| `/api/tools/document` | POST | Document analysis |
| `/api/tools/code` | POST | Code operations |
| `/api/tools/study` | POST | Study assistance |
| `/api/tools/language` | POST | Translation |
| `/api/tools/search` | POST | AI-powered search |
| `/api/tools/image` | POST | Image analysis |
| `/api/tools/creative` | POST | Creative content |

## Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key (required)
- `SESSION_SECRET`: Session secret for Express

## Development Commands
- `npm run dev`: Start development server (port 5000)
- `npm run build`: Build for production

## User Preferences
- Default theme: Dark mode
- Personality: Friendly
- TTS enabled by default
- Auto-pause music during speech
