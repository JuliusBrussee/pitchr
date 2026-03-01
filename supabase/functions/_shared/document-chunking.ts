// Document chunking and text extraction utilities.
// Handles DOCX text extraction and plain text normalization/chunking.

import type { BlockLocator } from './project-document-service.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TextBlock {
  block_index: number;
  block_text: string;
  locator: BlockLocator;
  word_count: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BLOCK_WORDS = 300;
const MIN_BLOCK_WORDS = 20;
const TARGET_BLOCK_WORDS = 200;

// ---------------------------------------------------------------------------
// DOCX extraction (lightweight, Deno-compatible)
// ---------------------------------------------------------------------------

/**
 * Extract text from a DOCX file buffer.
 * DOCX files are ZIP archives containing XML documents.
 * We read the document.xml content and extract paragraph text.
 */
export async function extractDocxText(buffer: Uint8Array): Promise<TextBlock[]> {
  // DOCX is a ZIP file. We need to find and parse document.xml.
  // Use a lightweight approach: find PK headers, locate document.xml entry.
  const xmlContent = await extractDocumentXml(buffer);
  if (!xmlContent) {
    throw new Error('Could not extract document.xml from DOCX file');
  }

  return parseDocumentXml(xmlContent);
}

/**
 * Extract document.xml content from a DOCX ZIP buffer.
 * Implements basic ZIP local file header parsing.
 */
async function extractDocumentXml(buffer: Uint8Array): Promise<string | null> {
  // Try using DecompressionStream for deflate if available
  const decoder = new TextDecoder('utf-8');

  // Parse ZIP local file headers to find word/document.xml
  let offset = 0;
  while (offset < buffer.length - 4) {
    // Look for local file header signature (PK\x03\x04)
    if (
      buffer[offset] !== 0x50 ||
      buffer[offset + 1] !== 0x4b ||
      buffer[offset + 2] !== 0x03 ||
      buffer[offset + 3] !== 0x04
    ) {
      offset++;
      continue;
    }

    // Parse local file header
    const compressionMethod = buffer[offset + 8] | (buffer[offset + 9] << 8);
    const compressedSize = (
      buffer[offset + 18] |
      (buffer[offset + 19] << 8) |
      (buffer[offset + 20] << 16) |
      (buffer[offset + 21] << 24)
    ) >>> 0;
    const fileNameLength = buffer[offset + 26] | (buffer[offset + 27] << 8);
    const extraFieldLength = buffer[offset + 28] | (buffer[offset + 29] << 8);

    const fileNameStart = offset + 30;
    const fileName = decoder.decode(buffer.slice(fileNameStart, fileNameStart + fileNameLength));
    const dataStart = fileNameStart + fileNameLength + extraFieldLength;

    if (fileName === 'word/document.xml') {
      const compressedData = buffer.slice(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        // Stored (no compression)
        return decoder.decode(compressedData);
      }

      if (compressionMethod === 8) {
        // Deflate — use DecompressionStream
        try {
          const rawDeflateData = compressedData;
          const ds = new DecompressionStream('raw');
          const writer = ds.writable.getWriter();
          const reader = ds.readable.getReader();

          writer.write(rawDeflateData);
          writer.close();

          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          const result = new Uint8Array(totalLength);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }

          return decoder.decode(result);
        } catch {
          // Decompression failed
          return null;
        }
      }

      return null;
    }

    // Skip to next entry
    offset = dataStart + compressedSize;
  }

  return null;
}

/**
 * Parse document.xml content and extract text blocks.
 * Handles paragraph (<w:p>), heading, and run (<w:r>) elements.
 */
function parseDocumentXml(xml: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let blockIndex = 0;
  let paragraphIndex = 0;

  // Extract paragraphs using regex (lightweight, no XML parser dependency)
  const paragraphRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let match;

  while ((match = paragraphRegex.exec(xml)) !== null) {
    const paragraphContent = match[1];
    paragraphIndex++;

    // Check if this is a heading
    const headingMatch = paragraphContent.match(/<w:pStyle\s+w:val="Heading(\d)"/);
    const headingLevel = headingMatch ? parseInt(headingMatch[1], 10) : undefined;

    // Extract all text runs from this paragraph
    const textParts: string[] = [];
    const runRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let runMatch;
    while ((runMatch = runRegex.exec(paragraphContent)) !== null) {
      textParts.push(runMatch[1]);
    }

    const text = textParts.join('').trim();
    if (!text) continue;

    const wordCount = countWords(text);

    const locator: BlockLocator = headingLevel
      ? {
          type: 'heading',
          paragraph: paragraphIndex,
          heading_level: headingLevel,
          heading_text: text.slice(0, 100),
        }
      : {
          type: 'paragraph',
          paragraph: paragraphIndex,
        };

    blocks.push({
      block_index: blockIndex++,
      block_text: text,
      locator,
      word_count: wordCount,
    });
  }

  // Merge very short blocks and split very long blocks
  return normalizeBlocks(blocks);
}

// ---------------------------------------------------------------------------
// Plain text chunking
// ---------------------------------------------------------------------------

/**
 * Chunk plain text into blocks using paragraph/line boundaries.
 */
export function chunkPlainText(text: string): TextBlock[] {
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!cleanedText) return [];

  // Split into paragraphs (separated by blank lines)
  const paragraphs = cleanedText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks: TextBlock[] = [];
  let blockIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const wordCount = countWords(paragraph);

    blocks.push({
      block_index: blockIndex++,
      block_text: paragraph,
      locator: {
        type: 'text_chunk',
        paragraph: i + 1,
      },
      word_count: wordCount,
    });
  }

  return normalizeBlocks(blocks);
}

// ---------------------------------------------------------------------------
// Block normalization
// ---------------------------------------------------------------------------

/**
 * Normalize blocks: merge very short consecutive blocks,
 * split very long blocks at sentence boundaries.
 */
function normalizeBlocks(blocks: TextBlock[]): TextBlock[] {
  if (blocks.length === 0) return [];

  const result: TextBlock[] = [];
  let accumulated: TextBlock | null = null;

  for (const block of blocks) {
    // Always keep headings as separate blocks
    if (block.locator.type === 'heading') {
      if (accumulated) {
        result.push(accumulated);
        accumulated = null;
      }
      result.push(block);
      continue;
    }

    if (block.word_count > MAX_BLOCK_WORDS) {
      // Flush accumulated
      if (accumulated) {
        result.push(accumulated);
        accumulated = null;
      }
      // Split long block
      const splits = splitAtSentenceBoundary(block);
      result.push(...splits);
      continue;
    }

    if (block.word_count < MIN_BLOCK_WORDS && accumulated) {
      // Merge with accumulated
      accumulated = {
        ...accumulated,
        block_text: accumulated.block_text + '\n\n' + block.block_text,
        word_count: accumulated.word_count + block.word_count,
      };
      continue;
    }

    if (accumulated) {
      if (accumulated.word_count < MIN_BLOCK_WORDS) {
        // Merge with current
        accumulated = {
          ...accumulated,
          block_text: accumulated.block_text + '\n\n' + block.block_text,
          word_count: accumulated.word_count + block.word_count,
        };
        continue;
      }
      result.push(accumulated);
    }

    accumulated = { ...block };
  }

  if (accumulated) {
    result.push(accumulated);
  }

  // Re-index
  return result.map((block, i) => ({
    ...block,
    block_index: i,
  }));
}

/**
 * Split a long block at sentence boundaries.
 */
function splitAtSentenceBoundary(block: TextBlock): TextBlock[] {
  const sentences = block.block_text.match(/[^.!?]+[.!?]+\s*/g) ?? [block.block_text];
  const result: TextBlock[] = [];
  let currentText = '';
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);

    if (currentWords + sentenceWords > TARGET_BLOCK_WORDS && currentText.trim()) {
      result.push({
        block_index: 0, // Will be re-indexed
        block_text: currentText.trim(),
        locator: { ...block.locator, type: 'text_chunk' },
        word_count: currentWords,
      });
      currentText = sentence;
      currentWords = sentenceWords;
    } else {
      currentText += sentence;
      currentWords += sentenceWords;
    }
  }

  if (currentText.trim()) {
    result.push({
      block_index: 0,
      block_text: currentText.trim(),
      locator: { ...block.locator, type: 'text_chunk' },
      word_count: currentWords,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
