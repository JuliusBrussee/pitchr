export interface StoredMiroBoard {
  boardId: string;
  boardUrl: string;
  createdAt: string;
  fallback?: boolean;
  message?: string;
}

const MIRO_BOARD_STORAGE_KEY = 'pitchr_miro_boards';

type StoredMiroBoardMap = Record<string, StoredMiroBoard>;

function readStore(): StoredMiroBoardMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(MIRO_BOARD_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as StoredMiroBoardMap;
  } catch {
    return {};
  }
}

function writeStore(store: StoredMiroBoardMap): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MIRO_BOARD_STORAGE_KEY, JSON.stringify(store));
}

export function getStoredMiroBoard(runId: string): StoredMiroBoard | null {
  const store = readStore();
  return store[runId] ?? null;
}

export function saveStoredMiroBoard(runId: string, board: StoredMiroBoard): void {
  const store = readStore();
  store[runId] = board;
  writeStore(store);
}

export function deleteStoredMiroBoard(runId: string): void {
  const store = readStore();
  if (!store[runId]) return;
  delete store[runId];
  writeStore(store);
}
