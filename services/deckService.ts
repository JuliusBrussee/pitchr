import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { SupabaseClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);

/* ─── Types ─── */

export interface DeckRecord {
  id: string;
  name: string;
  original_url: string;
  pdf_url: string;
  slide_count: number;
  thumbnail_url: string | null;
  created_at: string;
  user_id?: string;
}

export interface SlideRecord {
  id: string;
  deck_id: string;
  slide_num: number;
  text: string;
}

/* ─── PPTX → PDF Conversion ─── */

export async function convertPptxToPdf(pptxBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pitchr-'));
  const inputPath = path.join(tmpDir, 'input.pptx');
  const outputPath = path.join(tmpDir, 'input.pdf');

  try {
    await fs.writeFile(inputPath, pptxBuffer);

    await execFileAsync('soffice', [
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', tmpDir,
      inputPath,
    ]);

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

/* ─── PDF Text Extraction ─── */

export async function extractPdfText(
  pdfBuffer: Buffer,
): Promise<{ slideCount: number; slides: { slideNum: number; text: string }[] }> {
  const { PDFParse } = await import('pdf-parse');

  // Point worker to the bundled worker file shipped with pdf-parse
  const workerPath = path.join(
    process.cwd(),
    'node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs',
  );
  PDFParse.setWorker(workerPath);

  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  const result = await parser.getText();

  const slides: { slideNum: number; text: string }[] = result.pages.map((page) => ({
    slideNum: page.num,
    text: page.text.trim(),
  }));

  await parser.destroy();

  return { slideCount: result.total, slides };
}

/* ─── Supabase Storage ─── */

export async function uploadToStorage(
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  fileName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const filePath = `${userId}/${deckId}/${fileName}`;

  const { error } = await supabase.storage
    .from('decks')
    .upload(filePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from('decks').getPublicUrl(filePath);
  return data.publicUrl;
}

/* ─── Database Operations ─── */

export async function insertDeck(
  supabase: SupabaseClient,
  deck: Omit<DeckRecord, 'id' | 'created_at'>,
): Promise<DeckRecord> {
  const { data, error } = await supabase
    .from('decks')
    .insert(deck)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert deck: ${error.message}`);
  return data;
}

export async function insertSlides(
  supabase: SupabaseClient,
  deckId: string,
  slides: { slideNum: number; text: string }[],
): Promise<void> {
  const rows = slides.map((s) => ({
    deck_id: deckId,
    slide_num: s.slideNum,
    text: s.text,
  }));

  const { error } = await supabase.from('slides').insert(rows);
  if (error) throw new Error(`Failed to insert slides: ${error.message}`);
}

export async function listDecks(supabase: SupabaseClient): Promise<DeckRecord[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list decks: ${error.message}`);
  return data;
}

export async function getDeckWithSlides(
  supabase: SupabaseClient,
  deckId: string,
): Promise<{ deck: DeckRecord; slides: SlideRecord[] }> {
  const [deckRes, slidesRes] = await Promise.all([
    supabase.from('decks').select('*').eq('id', deckId).single(),
    supabase
      .from('slides')
      .select('*')
      .eq('deck_id', deckId)
      .order('slide_num', { ascending: true }),
  ]);

  if (deckRes.error) throw new Error(`Failed to get deck: ${deckRes.error.message}`);
  if (slidesRes.error) throw new Error(`Failed to get slides: ${slidesRes.error.message}`);

  return { deck: deckRes.data, slides: slidesRes.data };
}

export async function deleteDeck(supabase: SupabaseClient, userId: string, deckId: string): Promise<void> {
  // Delete storage files first
  const { data: files } = await supabase.storage.from('decks').list(`${userId}/${deckId}`);

  if (files && files.length > 0) {
    const paths = files.map((f: { name: string }) => `${userId}/${deckId}/${f.name}`);
    await supabase.storage.from('decks').remove(paths);
  }

  // Delete DB record (slides cascade via FK)
  const { error } = await supabase.from('decks').delete().eq('id', deckId);
  if (error) throw new Error(`Failed to delete deck: ${error.message}`);
}
