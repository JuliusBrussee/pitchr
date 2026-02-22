# PPTX Upload & Rendering System — Design Doc

**Date:** 2026-02-21
**Status:** Approved
**Scope:** Upload, convert, store, and render pitch decks (PPTX/PDF) with per-slide text extraction

---

## Overview

Users upload a `.pptx` or `.pdf` file on the Deck Manager page. The system converts PPTX to PDF locally via LibreOffice, stores both files in Supabase Storage, extracts per-slide text, and saves metadata to Supabase Postgres. The session view renders the PDF slide-by-slide using pdf.js with keyboard/button navigation.

## Approach: Hybrid (PPTX→PDF + pdf.js)

- Accept both PPTX and PDF uploads
- PPTX goes through LibreOffice → PDF conversion on localhost
- All PDFs rendered client-side via pdf.js (canvas-based)
- Text extraction from PDF is built-in to pdf.js
- Fallback: if LibreOffice isn't installed, user uploads PDF directly

## Database Schema (Supabase Postgres)

```sql
create table decks (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  original_url  text not null,
  pdf_url       text not null,
  slide_count   integer not null,
  thumbnail_url text,
  created_at    timestamptz default now()
);

create table slides (
  id         uuid primary key default gen_random_uuid(),
  deck_id    uuid not null references decks(id) on delete cascade,
  slide_num  integer not null,
  text       text not null default '',
  unique(deck_id, slide_num)
);
```

No RLS policies (no auth in MVP). Session linking (`deck_id` FK on runs table) deferred until sessions are wired.

### Storage Bucket

- Bucket name: `decks`
- Path pattern: `{deck_id}/original.{pptx|pdf}`, `{deck_id}/slides.pdf`

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/deck/upload` | POST | Multipart file upload → convert → store → extract text → insert DB |
| `/api/deck` | GET | List all decks |
| `/api/deck/[deckId]` | GET | Single deck + slides |
| `/api/deck/[deckId]` | DELETE | Remove deck + storage files + DB records |

## Upload Flow

```
User drops file on Deck Manager
  → POST /api/deck/upload (multipart/form-data)
  → API route:
    1. Validate file type (.pptx or .pdf) and size (<50MB)
    2. If PPTX: shell out to LibreOffice for PDF conversion
    3. Upload original file to Supabase Storage: {id}/original.{ext}
    4. Upload PDF to Supabase Storage: {id}/slides.pdf
    5. Use pdf.js (server-side) or pdfjs-dist to count pages + extract text
    6. Insert into `decks` table
    7. Insert per-slide text into `slides` table
    8. Return deck record
```

## Component Changes

| Component | Change |
|-----------|--------|
| `SessionCanvas.tsx` → `SlideViewer` | Replace placeholder with pdf.js canvas renderer. Props: `pdfUrl`, `currentSlide`, `onSlideChange` |
| `SessionCanvas.tsx` → `SlideViewerMini` | Same renderer, smaller, shows current slide |
| `SessionCanvas.tsx` → SkipBack/SkipForward | Wire to slide navigation (currently no-ops) |
| `deck/page.tsx` | Replace MOCK_DECKS with GET /api/deck. Wire dropzone to POST /api/deck/upload. |

## New Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client initialization |
| `hooks/useDeckSlides.ts` | Hook for PDF loading + slide navigation in session |
| `services/deckService.ts` | PPTX→PDF conversion, text extraction, Supabase upload |
| `migrations/01-create-decks-table.sql` | Decks table migration |
| `migrations/02-create-slides-table.sql` | Slides table migration (FK + index) |
| `migrations/03-create-decks-storage-bucket.sql` | Storage bucket creation |
| `migrations/04-storage-policies.sql` | Public read/upload/delete policies |

## Dependencies

- `@supabase/supabase-js` — DB + Storage client
- `pdfjs-dist` — Client-side PDF rendering + text extraction

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Error Handling

- No LibreOffice → return error suggesting PDF upload
- File >50MB → reject at API route
- PDF render fails → error state in SlideViewer
- Supabase errors → surface to user, no silent swallowing

## Out of Scope

- Auth / RLS policies
- PPTX generation (AI-created slides)
- Real-time collaboration
- Google Slides import
