import { NextRequest, NextResponse } from 'next/server';
import {
  convertPptxToPdf,
  extractPdfText,
  uploadToStorage,
  insertDeck,
  insertSlides,
} from '@/services/deckService';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.pptx']);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .pptx and .pdf files are accepted.' },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isPptx = ext === '.pptx';
    let pdfBuffer: Buffer;

    // Convert PPTX → PDF if needed
    if (isPptx) {
      try {
        pdfBuffer = await convertPptxToPdf(buffer);
      } catch {
        return NextResponse.json(
          {
            error:
              'LibreOffice is not installed or conversion failed. Please upload a PDF instead.',
          },
          { status: 422 },
        );
      }
    } else {
      pdfBuffer = buffer;
    }

    // Extract text + count pages
    console.log('[deck/upload] extracting PDF text...');
    const { slideCount, slides } = await extractPdfText(pdfBuffer);
    console.log('[deck/upload] extracted', slideCount, 'slides');

    // Generate a temporary ID for storage paths (will be replaced by DB-generated UUID)
    const tempId = crypto.randomUUID();

    // Upload files to Supabase Storage
    console.log('[deck/upload] uploading to storage...');
    const [originalUrl, pdfUrl] = await Promise.all([
      uploadToStorage(
        tempId,
        `original${ext}`,
        buffer,
        file.type || 'application/octet-stream',
      ),
      isPptx
        ? uploadToStorage(tempId, 'slides.pdf', pdfBuffer, 'application/pdf')
        : Promise.resolve(''), // PDF original IS the slides.pdf
    ]);
    console.log('[deck/upload] storage done');

    // For PDF uploads, the original IS the slides PDF
    const finalPdfUrl = isPptx ? pdfUrl : originalUrl;

    // Insert deck record
    console.log('[deck/upload] inserting deck record...');
    const deckName = file.name.replace(/\.(pptx|pdf)$/i, '');
    const deck = await insertDeck({
      name: deckName,
      original_url: originalUrl,
      pdf_url: finalPdfUrl,
      slide_count: slideCount,
      thumbnail_url: null,
    });
    console.log('[deck/upload] deck inserted:', deck.id);

    // Insert per-slide text
    console.log('[deck/upload] inserting slides...');
    await insertSlides(deck.id, slides);
    console.log('[deck/upload] done');

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error('[deck/upload] ERROR:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
