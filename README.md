# GrowEasy CSV Importer — AI-Powered CRM Data Import

An intelligent CSV importer that accepts files with any column structure, uses Google Gemini AI to map fields to a standardized CRM schema, validates records, and exports clean data. Built for GrowEasy CRM.

---

## ✨ Features

- **AI-Powered Field Mapping** — Upload CSVs with messy, non-standard column names. Gemini 1.5 Flash (with Groq fallback) intelligently maps them to your CRM schema.
- **Drag & Drop Upload** — Beautiful drag & drop zone with file validation (CSV only, 10MB max).
- **Raw CSV Preview** — View your data in a scrollable table before importing.
- **Batch Processing** — Large CSVs are split into batches of 20 rows for reliable AI processing.
- **Smart Validation** — Records without email or phone are auto-skipped. Enum fields are strictly validated.
- **Import History** — View past imports with full details, isolated per browser.
- **Download Results** — Export cleaned CRM records as CSV.
- **Dark Mode** — Full dark mode support with system preference detection.
- **Responsive Design** — Works on mobile, tablet, and desktop.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS 3 |
| Backend | Express 4 + TypeScript |
| Database | MongoDB Atlas (Mongoose 8) |
| AI | Google Gemini 1.5 Flash + Groq Llama 3.1 8B fallback |
| Validation | Zod 3 |
| CSV Parsing | PapaParse (frontend) + csv-parse (backend) |
| Hosting | Vercel (frontend) + Render (backend) |

---

## 📋 Prerequisites

- **Node.js** 18+ (with npm)
- **MongoDB Atlas** account (free M0 cluster) — [mongodb.com/atlas](https://mongodb.com/atlas)
- **Google Gemini API key** (free, no credit card) — [ai.google.dev](https://ai.google.dev)
- **Groq API key** (free, no credit card) — [console.groq.com](https://console.groq.com)

---

## 🚀 Installation & Local Development

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd intern-project
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (or edit the existing one):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/groweasy
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
# Server runs on http://localhost:3001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
# App runs on http://localhost:3000
```

---

## 🌐 Deployment

### Vercel (Frontend)

1. Push repo to GitHub
2. Connect to [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_BACKEND_URL` = your Render backend URL
5. Deploy

### Render (Backend)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables: `MONGODB_URI`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `PORT=3001`, `FRONTEND_URL`
7. Deploy

### MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free M0 cluster (512MB)
3. Create database user and get connection string
4. Whitelist IPs (or allow all: `0.0.0.0/0`)
5. Use the connection string as `MONGODB_URI`

### Gemini & Groq APIs

1. Go to [ai.google.dev](https://ai.google.dev) to get your `GEMINI_API_KEY`
2. Go to [console.groq.com](https://console.groq.com) to get your `GROQ_API_KEY`

---

## 📡 API Documentation

### `POST /api/import`

Upload and process a CSV file.

**Request:** Multipart form data
- `file` — CSV file (required)
- `browserId` — Browser session ID (optional, auto-generated)

**Response:**
```json
{
  "importId": "667abc...",
  "importedRecords": [{ "created_at": "...", "name": "...", ... }],
  "skippedRecords": [{ "rowNumber": 5, "data": {...}, "reason": "No email or mobile" }],
  "totalImported": 8,
  "totalSkipped": 2
}
```

**Errors:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | NO_FILE | No file uploaded |
| 400 | INVALID_CSV | File is not valid CSV |
| 400 | EMPTY_CSV | CSV has no data |
| 413 | FILE_TOO_LARGE | File exceeds 10MB |
| 502 | AI_PROCESSING_FAILED | Gemini API failed |

---

### `GET /api/imports`

List past imports for the current browser.

**Query params:** `browserId` (string)

**Response:**
```json
{
  "imports": [
    {
      "_id": "667abc...",
      "originalFilename": "leads.csv",
      "createdAt": "2026-07-07T10:00:00Z",
      "totalImported": 8,
      "totalSkipped": 2
    }
  ]
}
```

---

### `GET /api/imports/:id`

Get full details of a specific import.

**Query params:** `browserId` (string)

**Response:** Full import object with `crmRecords` and `skippedRecords` arrays.

---

### `GET /health`

Health check endpoint.

**Response:** `{ "status": "ok", "timestamp": "...", "uptime": 123.45 }`

---

## 📁 Project Structure

```
intern-project/
├── frontend/                    # Next.js 14 frontend
│   ├── app/
│   │   ├── page.tsx             # Main import flow (5-step wizard)
│   │   ├── layout.tsx           # Root layout with Navbar
│   │   ├── globals.css          # Tailwind + custom styles
│   │   └── history/
│   │       └── page.tsx         # Past imports page
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation + dark mode toggle
│   │   ├── FileUpload.tsx       # Drag & drop upload zone
│   │   ├── PreviewTable.tsx     # Raw CSV preview table
│   │   ├── ResultTable.tsx      # Import results (tabbed view)
│   │   ├── StatsBar.tsx         # Import/skip/total stat cards
│   │   ├── LoadingState.tsx     # AI processing spinner
│   │   └── HistoryList.tsx      # Past imports card list
│   ├── lib/
│   │   ├── api.ts               # Backend API wrappers
│   │   └── csvParser.ts         # PapaParse client-side parser
│   └── types/
│       └── crm.ts               # TypeScript interfaces
│
├── backend/                     # Express + TypeScript backend
│   └── src/
│       ├── server.ts            # Express app entry point
│       ├── routes/
│       │   ├── import.ts        # POST /api/import
│       │   └── history.ts       # GET /api/imports
│       ├── services/
│       │   ├── aiExtractor.ts   # Gemini AI field extraction
│       │   ├── csvParser.ts     # Server-side CSV parsing
│       │   ├── batchSplitter.ts # Row batching logic
│       │   └── recordValidator.ts # Zod schema validation
│       ├── models/
│       │   └── Import.ts        # Mongoose import schema
│       ├── config/
│       │   └── constants.ts     # Enums, limits, AI config
│       ├── middleware/
│       │   ├── upload.ts        # Multer CSV upload
│       │   └── errorHandler.ts  # Centralized error handling
│       ├── types/
│       │   └── crm.ts           # Shared TypeScript types
│       └── db/
│           └── connection.ts    # MongoDB connection + retry
│
└── README.md                    # This file
```

---

## 🤖 How the AI Works

### Prompt Strategy

The system uses a **detailed system prompt** that instructs Gemini to:

1. **Intelligent Column Mapping** — Match messy CSV headers to CRM fields using pattern recognition (e.g., "Full Name" → `name`, "E-mail Address" → `email`).

2. **Status Normalization** — Map free-text statuses to enum values (e.g., "follow up" → `GOOD_LEAD_FOLLOW_UP`).

3. **Data Cleaning** — Extract phone numbers, separate country codes, handle multiple emails/phones.

4. **Strict Validation** — Only output valid JSON arrays with exact field names.

### High Availability AI

The system uses a two-tier AI approach:
1. **Primary**: Google Gemini 1.5 Flash (via `@google/generative-ai`)
2. **Fallback**: Groq Llama 3.1 8B (via `groq-sdk`)

If Gemini hits rate limits or fails on a batch, the system automatically falls back to Groq, ensuring maximum reliability.

### Batch Processing

Large CSVs are split into batches of 20 rows. Each batch is sent independently to Gemini, so:
- Token limits are respected
- A failed batch doesn't lose the entire import
- Processing is more reliable

### Post-AI Validation

After Gemini returns results, a Zod schema validator:
- Checks that email OR phone exists (skips records without either)
- Validates enum values (`crm_status`, `data_source`)
- Ensures dates are parseable
- Sanitizes fields (removes newlines, trims whitespace)

---

## 🧪 Testing

### Quick Test Flow

1. Start both servers (backend on :3001, frontend on :3000)
2. Open http://localhost:3000
3. Upload a CSV file (drag & drop or click)
4. Review the preview table
5. Click "Confirm Import with AI"
6. View results with imported/skipped breakdown
7. Navigate to History to see past imports

### Edge Cases to Test

- Empty CSV → Error message
- CSV with only headers → Error message  
- Non-CSV file → Error message
- File > 10MB → Error message
- CSV with no email/phone columns → All records skipped
- CSV with multiple emails → First used, others in crm_note
- Large CSV (1000+ rows) → Batch processing works correctly

---

## 🔮 Future Improvements

- [ ] Virtualized table for 10,000+ row CSVs
- [ ] Real-time batch progress via WebSocket/SSE
- [ ] Duplicate lead detection
- [ ] Manual field mapping override (before AI processing)
- [ ] Retry failed batches individually
- [ ] Unit tests (Jest) for validators and services
- [ ] Docker setup for containerized deployment
- [ ] Rate limiting and API authentication
- [ ] Email validation with advanced regex
- [ ] Bulk delete past imports

---

## 👤 Author

Built as an internship project for GrowEasy.

**Date:** July 2026
