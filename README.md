# Draftly

A modern full-stack collaborative design application built with Next.js, Convex, and Redux.

## Overview

Draftly is a web-based design platform that enables teams to create, collaborate, and manage design projects in real-time.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Backend**: Convex for real-time database and serverless functions
- **State Management**: Redux Toolkit
- **UI Components**: Radix UI with Tailwind CSS
- **Authentication**: Convex Auth with Google OAuth
- **Language**: TypeScript

## Features

- User authentication and authorization
- Project management and creation
- Real-time collaboration
- Protected dashboard with session-based routing
- Responsive UI with modern design components

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Environment Setup

Create a `.env.local` file with your Convex and authentication credentials:

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOY_KEY=your_deploy_key
```

## Project Structure

```
draftly/
├── app/              # Next.js app directory
├── components/       # React components
├── convex/          # Convex backend functions
├── redux/           # Redux store and slices
├── hooks/           # Custom React hooks
└── lib/             # Utility functions
```

## License

Private - All rights reserved

