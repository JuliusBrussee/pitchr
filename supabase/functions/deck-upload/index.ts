// Edge Function: deck-upload
// Replaces: app/api/deck/upload/route.ts
// Methods: POST (upload deck file)
//
// Note: Only PDF uploads are supported. PPTX files require LibreOffice for
// conversion which is not available in Deno edge functions.
// PDF text extraction uses a lightweight parser that reads text objects
// directly from the PDF binary stream (BT...ET blocks with Tj/TJ operators).

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import {
  uploadToStorage,
  insertDeck,
  insertSlides,
} from '../_shared/deck-service.ts';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/* ─── Lightweight PDF text extraction ─── */

/**
 * Count pages in a PDF by looking for /Type /Page entries that are not /Pages.
 * This is a heuristic and may not be 100% accurate for all PDFs.
 */
function countPdfPages(pdfText: string): number {
  // Match /Type /Page but not /Type /Pages
  const pageMatches = pdfText.match(/\/Type\s*\/Page(?!\s*s)\b/g);
  return pageMatches ? pageMatches.length : 1;
}

/**
 * Decode a PDF hex string like <48656C6C6F> to "Hello"
 */
function decodeHexString(hex: string): string {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code >= 32 && code < 127) {
      result += String.fromCharCode(code);
    }
  }
  return result;
}

/**
 * Decode a PDF literal string like (Hello World) handling escape sequences.
 * Handles nested parentheses and standard PDF escape characters.
 */
function decodeLiteralString(raw: string): string {
  let result = '';
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1];
      switch (next) {
        case 'n': result += '\n'; break;
        case 'r': result += '\r'; break;
        case 't': result += '\t'; break;
        case 'b': result += '\b'; break;
        case 'f': result += '\f'; break;
        case '(': result += '('; break;
        case ')': result += ')'; break;
        case '\\': result += '\\'; break;
        default:
          // Octal escape \ddd
          if (next >= '0' && next <= '7') {
            let octal = next;
            if (i + 2 < raw.length && raw[i + 2] >= '0' && raw[i + 2] <= '7') {
              octal += raw[i + 2];
              i++;
              if (i + 1 < raw.length && raw[i + 1] >= '0' && raw[i + 1] <= '7') {
                octal += raw[i + 1];
                i++;
              }
            }
            const code = parseInt(octal, 8);
            if (code >= 32 && code < 127) {
              result += String.fromCharCode(code);
            }
          } else {
            result += next;
          }
          break;
      }
      i += 2;
    } else {
      result += raw[i];
      i++;
    }
  }
  return result;
}

/**
 * Extract text from a single BT...ET text object block.
 * Handles Tj (show string), TJ (show array), and ' / " operators.
 */
function extractTextFromBTBlock(block: string): string {
  const parts: string[] = [];

  // Match Tj operator: (string) Tj or <hexstring> Tj
  const tjRegex = /\(([^)]*)\)\s*Tj|<([0-9A-Fa-f]+)>\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(block)) !== null) {
    if (match[1] !== undefined) {
      parts.push(decodeLiteralString(match[1]));
    } else if (match[2] !== undefined) {
      parts.push(decodeHexString(match[2]));
    }
  }

  // Match TJ operator: [ (string) 123 (string) ... ] TJ
  const tjArrayRegex = /\[(.*?)\]\s*TJ/gs;
  while ((match = tjArrayRegex.exec(block)) !== null) {
    const arrayContent = match[1];
    // Extract strings from the array, skip numeric kerning values
    const stringRegex = /\(([^)]*)\)|<([0-9A-Fa-f]+)>/g;
    let strMatch;
    while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
      if (strMatch[1] !== undefined) {
        parts.push(decodeLiteralString(strMatch[1]));
      } else if (strMatch[2] !== undefined) {
        parts.push(decodeHexString(strMatch[2]));
      }
    }
  }

  // Match ' operator (move to next line and show string)
  const quoteRegex = /\(([^)]*)\)\s*'/g;
  while ((match = quoteRegex.exec(block)) !== null) {
    if (match[1] !== undefined) {
      parts.push(decodeLiteralString(match[1]));
    }
  }

  return parts.join('');
}

/**
 * Extract text content from a PDF buffer using raw PDF stream parsing.
 *
 * This parser looks for BT (Begin Text) ... ET (End Text) blocks in the PDF
 * and extracts strings from Tj, TJ, and ' operators. It handles both literal
 * strings (...) and hex strings <...>.
 *
 * Limitations:
 * - Cannot decode CIDFont/ToUnicode-mapped text (common in modern PDFs)
 * - Cannot decompress Flate-encoded streams (most PDF content streams)
 * - May miss text in encrypted PDFs
 * - Does not handle content stream cross-references
 *
 * For PDFs with compressed streams (the majority), this will extract whatever
 * uncompressed text is present. Returns an array of per-page text where possible,
 * or a single-element array with all extracted text.
 */
function extractPdfText(buffer: Uint8Array): string[] {
  // Decode the PDF bytes to a Latin-1 string to preserve all byte values
  const decoder = new TextDecoder('latin1');
  const pdfText = decoder.decode(buffer);

  const pageCount = countPdfPages(pdfText);

  // Find all BT...ET blocks and extract text
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  const allTextBlocks: string[] = [];
  let match;

  while ((match = btEtRegex.exec(pdfText)) !== null) {
    const blockText = extractTextFromBTBlock(match[1]);
    const cleaned = blockText.trim();
    if (cleaned.length > 0) {
      allTextBlocks.push(cleaned);
    }
  }

  // If we found text, combine it
  if (allTextBlocks.length > 0) {
    const combinedText = allTextBlocks.join(' ');
    // Clean up: collapse whitespace, remove control characters
    const cleanedText = combinedText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length > 0) {
      // Try to split evenly across detected pages
      if (pageCount > 1) {
        const chunkSize = Math.ceil(cleanedText.length / pageCount);
        const pages: string[] = [];
        for (let i = 0; i < pageCount; i++) {
          const start = i * chunkSize;
          const chunk = cleanedText.substring(start, start + chunkSize).trim();
          pages.push(chunk || `[Slide ${i + 1}]`);
        }
        return pages;
      }
      return [cleanedText];
    }
  }

  // Fallback: try to find any readable ASCII strings > 4 chars from the buffer.
  // This catches text that may be outside BT/ET blocks.
  const fallbackStrings: string[] = [];
  const asciiRegex = /[\x20-\x7E]{5,}/g;
  let asciiMatch;
  while ((asciiMatch = asciiRegex.exec(pdfText)) !== null) {
    const s = asciiMatch[0].trim();
    // Skip PDF structural keywords
    if (
      s.startsWith('/') ||
      s.startsWith('<<') ||
      s.startsWith('>>') ||
      s.startsWith('stream') ||
      s.startsWith('endstream') ||
      s.startsWith('endobj') ||
      /^\d+ \d+ obj$/.test(s) ||
      /^xref$/.test(s)
    ) {
      continue;
    }
    // Skip lines that look like PDF operators or metadata
    if (/^[A-Z]{1,2}\s*$/.test(s) || /^\d+(\.\d+)?\s+\d+(\.\d+)?/.test(s)) {
      continue;
    }
    if (s.length > 4) {
      fallbackStrings.push(s);
    }
  }

  if (fallbackStrings.length > 0) {
    const combined = fallbackStrings.join(' ').trim();
    if (combined.length > 10) {
      // Return as pages
      if (pageCount > 1) {
        const chunkSize = Math.ceil(combined.length / pageCount);
        const pages: string[] = [];
        for (let i = 0; i < pageCount; i++) {
          const start = i * chunkSize;
          const chunk = combined.substring(start, start + chunkSize).trim();
          pages.push(chunk || `[Slide ${i + 1}]`);
        }
        return pages;
      }
      return [combined];
    }
  }

  // No text could be extracted -- return empty array
  return [];
}

/* ─── Main handler ─── */

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isPdf = ext === '.pdf';
    const isPptx = ext === '.pptx';

    if (!isPdf && !isPptx) {
      return errorResponse(
        'Invalid file type. Only PDF files are accepted.',
        400,
      );
    }

    // Reject PPTX with a clear message
    if (isPptx) {
      return errorResponse(
        'PDF format required -- PPTX conversion is not supported in this environment. Please convert your PowerPoint file to PDF before uploading.',
        422,
      );
    }

    // Validate MIME type for PDFs
    if (file.type && file.type !== 'application/pdf' && file.type !== 'application/octet-stream') {
      return errorResponse(
        'Invalid file type. Only PDF files are accepted.',
        400,
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File too large. Maximum size is 50MB.', 400);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Upload file to Supabase Storage
    const tempId = crypto.randomUUID();
    const originalUrl = await uploadToStorage(
      supabase,
      user.id,
      tempId,
      'original.pdf',
      buffer,
      'application/pdf',
    );

    // Attempt PDF text extraction
    let slides: { slideNum: number; text: string }[] = [];
    let slideCount = 0;

    try {
      const extractedPages = extractPdfText(buffer);

      if (extractedPages.length > 0) {
        slides = extractedPages.map((text, i) => ({
          slideNum: i + 1,
          text,
        }));
        slideCount = slides.length;
      }
    } catch (_extractionError) {
      // Text extraction failed -- fall through to placeholder
    }

    // If extraction yielded nothing, insert a helpful placeholder
    if (slides.length === 0) {
      const pageCount = countPdfPages(new TextDecoder('latin1').decode(buffer));
      slideCount = Math.max(pageCount, 1);
      slides = [
        {
          slideNum: 1,
          text: 'PDF uploaded successfully. Text extraction was not possible for this file (the PDF may use compressed or image-based content). You can still reference this deck in your pitch sessions.',
        },
      ];
    }

    // Insert deck record
    const deckName = file.name.replace(/\.pdf$/i, '');
    const deck = await insertDeck(supabase, {
      name: deckName,
      original_url: originalUrl,
      pdf_url: originalUrl,
      slide_count: slideCount,
      thumbnail_url: null,
      user_id: user.id,
    });

    // Insert slide records
    await insertSlides(supabase, deck.id, slides);

    return jsonResponse(deck, 201);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Upload failed',
      500,
    );
  }
});
