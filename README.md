# Lisora - Quality Management System

A comprehensive Quality Management System (QMS) platform built with Next.js 15, designed to support multiple ISO standards including ISO 9001, ISO 13485, ISO 14001, ISO 27001, and more.

## Features

- **Multi-ISO Support** - Choose from ISO 9001, 13485, 14001, 27001, 45001, and 22000
- **Document Management** - Track and manage quality documents with versioning
- **CAPA System** - Corrective and Preventive Actions management
- **Training Records** - Employee training tracking and compliance
- **Audit Management** - Internal and external audit tracking
- **Risk Management** - Risk assessment and mitigation tracking
- **User Management** - Role-based access control

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod
- **Data Storage**: Supabase when configured, with browser storage fallback for local testing
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager

### Installation

1. **Clone or download the project**

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Default Setup

The application automatically creates a default admin user and prompts you to select your ISO standard on first use.

## Supported ISO Standards

- **ISO 9001:2015** - Quality Management Systems
- **ISO 13485:2016** - Medical Devices QMS
- **ISO 14001:2015** - Environmental Management
- **ISO 27001:2022** - Information Security
- **ISO 45001:2018** - Occupational Health & Safety
- **ISO 22000:2018** - Food Safety Management

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard and main features
│   │   ├── audits/         # Audit management
│   │   ├── capa/           # CAPA system
│   │   ├── documents/      # Document control
│   │   ├── risk/           # Risk management
│   │   ├── training/       # Training records
│   │   └── users/          # User management
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── iso-selector.tsx    # ISO standard selector
│   └── ...                 # Feature components
├── lib/                     # Utility functions
│   ├── local-storage.ts    # Storage utilities
│   └── indexed-db.ts       # IndexedDB for large files
└── public/                  # Static assets
```

## Supabase Setup

The app is wired for Supabase through a single `qms_records` table. To enable it:

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Paste your project URL and anon key:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Restart the dev server.

When those environment variables are missing, the app still works with browser storage for quick local testing.

The database stores:

- Documents with file attachments
- CAPA records
- Training records
- Audit data
- Risk assessments
- User profiles
- ISO standard preferences

**Note**: The included policies are permissive so the prototype works immediately with the anon key. Tighten row-level security before using this with private production data.

## Building for Production

```bash
npm run build
npm start
```

## Development

### Adding New Features

The application is modular and easy to extend:

1. Add new pages in `app/dashboard/[feature]/page.tsx`
2. Create feature-specific components in `components/`
3. Add data models and functions in `lib/local-storage.ts`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## VS Code Setup

The project includes VS Code configuration for optimal development experience. Recommended extensions are listed in `.vscode/extensions.json`.

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

Requires localStorage and IndexedDB support (all modern browsers).

## License

This project is private and proprietary.

## Support

For issues or questions, contact your system administrator.
