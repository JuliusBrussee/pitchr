'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileAudio, AlertCircle } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'webm', 'mp4', 'ogg'];
const ACCEPTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
  'video/webm',
  'video/mp4',
  'audio/ogg',
];
const ACCEPT_STRING = ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(',');
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

interface UploadDropZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  disabled?: boolean;
}

export function UploadDropZone({ file, onFileSelect, onFileRemove, disabled = false }: UploadDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback((selectedFile: File) => {
    setError(null);

    const ext = getExtension(selectedFile.name);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported format (.${ext}). Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError(`File too large (${formatFileSize(selectedFile.size)}). Maximum is 100 MB.`);
      return;
    }

    if (selectedFile.type && !ACCEPTED_MIME_TYPES.includes(selectedFile.type) && !selectedFile.type.startsWith('audio/') && !selectedFile.type.startsWith('video/')) {
      setError(`Unsupported file type (${selectedFile.type}).`);
      return;
    }

    onFileSelect(selectedFile);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSelect(droppedFile);
    }
  }, [disabled, validateAndSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSelect(selectedFile);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }, [validateAndSelect]);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onFileRemove();
  }, [onFileRemove]);

  const instructionsId = 'upload-drop-zone-instructions';

  if (file) {
    return (
      <div
        className="rounded-xl border p-4 flex items-center gap-4"
        style={{
          backgroundColor: 'var(--bg-surface-hover)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(255, 89, 65, 0.12)' }}
        >
          <FileAudio size={20} style={{ color: '#ff5941' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {file.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {formatFileSize(file.size)} &middot; .{getExtension(file.name)}
          </p>
        </div>
        <button
          onClick={handleRemove}
          disabled={disabled}
          className="p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{
            color: 'var(--text-muted)',
            focusRingColor: '#ff5941',
          }}
          aria-label="Remove selected file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-describedby={instructionsId}
        aria-label="Upload audio or video file for pitch analysis"
        className="rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          borderColor: isDragging ? '#ff5941' : 'var(--border-color)',
          backgroundColor: isDragging ? 'rgba(255, 89, 65, 0.06)' : 'transparent',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: isDragging ? 'rgba(255, 89, 65, 0.15)' : 'rgba(255, 89, 65, 0.08)',
          }}
        >
          <Upload size={22} style={{ color: '#ff5941' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {isDragging ? 'Drop your file here' : 'Drag & drop your recording'}
          </p>
          <p id={instructionsId} className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            or click to browse &middot; MP3, WAV, M4A, WebM, MP4, OGG &middot; Max 100 MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Select audio or video file"
        tabIndex={-1}
      />

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs"
          style={{
            color: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
