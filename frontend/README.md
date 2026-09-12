# Frontend

This is the React + TypeScript frontend for the Job Application Tracker. It handles the dashboard UI, job table editing, authentication screens, charts, and currency settings.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide icons

## Prerequisites

- Node.js 18 or newer
- npm

## Install dependencies

```bash
npm install
```

## Run locally

```bash
npm run dev
```

The app runs on:

- http://localhost:3000

## Production build

```bash
npm run build
```

## Type check

```bash
npm run lint
```

## Environment

This project does not require a Gemini API key for normal app usage. If you are working with a custom environment setup, you can copy the sample env file and adjust values if needed:

```bash
cp .env.example .env
```

If you are using the backend locally, make sure the frontend points to the correct API URL in your environment configuration.

## Project structure

```text
src/
  components/
  context/
  services/
  utils/
  App.tsx
  main.tsx
```

## Notes

This frontend is designed to work with the FastAPI backend in the `backend/` folder. Start the backend first if you want to connect to live job data and authentication.

