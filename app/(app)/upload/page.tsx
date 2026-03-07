'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileAudio,
  FileText,
} from 'lucide-react';
import { GlassCard } from '@/views/components/ui';
import { UploadDropZone } from '@/views/components/UploadDropZone';
import { ProjectSelect } from '@/views/components/ProjectSelect';
import { ModeSegmentedControl } from '@/views/components/ModeSegmentedControl';
import { useProject } from '@/views/components/ProjectProvider';
import { usePitchRun } from '@/hooks/usePitchRun';
import { createClient } from '@/lib/supabase/client';
import { uploadRecording } from '@/services/recordingService';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
import type { PitchMode } from '@/types/pitch';
import type { DeckRecord, SlideRecord } from '@/services/deckService';

type UploadStage = 'idle' | 'uploading' | 'transcribing' | 'analyzing';
type InputTab = 'audio' | 'text';

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: '',
  uploading: 'Uploading recording...',
  transcribing: 'Transcribing audio...',
  analyzing: 'Analyzing your pitch...',
};

const MIN_TRANSCRIPT_LENGTH = 50;
const MAX_TRANSCRIPT_LENGTH = 15_000;

const TIPS = [
  'Record in a quiet environment',
  'Speak clearly at a natural pace',
  'Keep your pitch within the target time (2 min for VC, 60s for elevator)',
  'Use a good quality microphone if possible',
  'Avoid background music or noise',
];

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? 'webm';
}

export default function UploadPage() {
  const router = useRouter();
  const { projects, activeProjectId, setActiveProject, isLoading: isProjectLoading } = useProject();
  const { runPitchAnalysis } = usePitchRun();

  const [inputTab, setInputTab] = useState<InputTab>('audio');
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [pitchMode, setPitchMode] = useState<PitchMode>('vc_pitch');
  const [stage, setStage] = useState<UploadStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  // Deck state
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const deckTextCacheRef = useRef<Record<string, string>>({});

  const isProcessing = stage !== 'idle';
  const projectId = activeProjectId ?? projects[0]?.id ?? null;

  // Fetch decks for the active project
  useEffect(() => {
    if (!projectId) {
      setDecks([]);
      setSelectedDeckId(null);
      setIsLoadingDecks(false);
      return;
    }
    setIsLoadingDecks(true);
    (async () => {
      try {
        const res = await fetchEdge('deck-list', { params: { projectId } });
        if (!res.ok) throw new Error('Failed to load decks');
        const data = await res.json();
        setDecks(data);
      } catch {
        // Silently fail — deck picker just won't show decks
      } finally {
        setIsLoadingDecks(false);
      }
    })();
  }, [projectId]);

  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? null,
    [decks, selectedDeckId],
  );

  const loadDeckText = useCallback(async (deckId: string): Promise<string | undefined> => {
    if (deckTextCacheRef.current[deckId]) return deckTextCacheRef.current[deckId];
    const response = await fetchEdge('deck-detail', { params: { deckId } });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { slides?: SlideRecord[] };
    const deckText = (payload.slides ?? [])
      .map((slide) => slide.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n\n')
      .trim();
    if (deckText) {
      deckTextCacheRef.current[deckId] = deckText;
      return deckText;
    }
    return undefined;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!projectId) return;

    if (inputTab === 'audio' && !file) return;
    if (inputTab === 'text' && transcript.trim().length < MIN_TRANSCRIPT_LENGTH) return;

    setError(null);
    setStage(inputTab === 'audio' ? 'uploading' : 'analyzing');

    try {
      let finalTranscript: string;
      let audioUrl: string | undefined;

      if (inputTab === 'audio') {
        // 1. Upload file to Supabase Storage
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated.');

        const tempId = crypto.randomUUID();
        const ext = getExtension(file!.name);
        audioUrl = await uploadRecording(supabase, user.id, tempId, file!, ext);

        // 2. Transcribe via edge function
        setStage('transcribing');
        const transcribeRes = await fetchEdge('transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioUrl }),
        });

        if (!transcribeRes.ok) {
          const errBody = await transcribeRes.json().catch(() => ({})) as { error?: string };
          throw new Error(errBody.error ?? `Transcription failed (${transcribeRes.status}).`);
        }

        const transcribeData = (await transcribeRes.json()) as { transcript: string };
        finalTranscript = transcribeData.transcript;
      } else {
        finalTranscript = transcript.trim();
      }

      // 3. Load deck text if selected
      let deckText: string | undefined;
      if (selectedDeckId) {
        try {
          deckText = await loadDeckText(selectedDeckId);
        } catch {
          deckText = undefined;
        }
      }

      // 4. Run analysis
      setStage('analyzing');
      const result = await runPitchAnalysis({
        projectId,
        mode: pitchMode,
        inputType: inputTab === 'audio' ? 'upload' : 'text',
        transcript: finalTranscript,
        audioUrl,
        deckId: selectedDeckId ?? undefined,
        deckText,
      });

      router.push(`/results/${result.runId}`);
    } catch (caughtError) {
      setStage('idle');
      setError(
        caughtError instanceof Error ? caughtError.message : 'Upload and analysis failed.',
      );
    }
  }, [inputTab, file, transcript, projectId, pitchMode, selectedDeckId, loadDeckText, runPitchAnalysis, router]);

  const canAnalyze = projectId && !isProcessing && (
    inputTab === 'audio' ? !!file : transcript.trim().length >= MIN_TRANSCRIPT_LENGTH
  );

  return (
    <main className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
      {/* Header */}
      <GlassCard className="flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 89, 65, 0.12)' }}
          >
            <Upload size={18} style={{ color: '#ff5941' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              Upload Pitch
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Upload a recording or paste your pitch script for AI analysis
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left column: Settings + Drop zone */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Project + Mode selectors */}
          <GlassCard className="flex flex-col gap-4">
            {/* Project */}
            <div>
              <label
                htmlFor="upload-project"
                className="text-xs font-medium block mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Project
              </label>
              <ProjectSelect
                id="upload-project"
                ariaLabel="Select project"
                disabled={isProjectLoading || projects.length === 0 || isProcessing}
                value={projectId ?? ''}
                placeholder={isProjectLoading ? 'Loading projects...' : 'No projects'}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
                onChange={(nextId) => {
                  if (nextId && nextId !== activeProjectId) {
                    void setActiveProject(nextId).catch(() => {});
                  }
                }}
              />
            </div>

            {/* Pitch mode toggle */}
            <div>
              <label
                className="text-xs font-medium block mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pitch Type
              </label>
              <ModeSegmentedControl
                value={pitchMode}
                onChange={setPitchMode}
                disabled={isProcessing}
              />
            </div>

            {/* Deck selector */}
            {decks.length > 0 && (
              <div>
                <label
                  htmlFor="upload-deck"
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Deck (optional)
                </label>
                <ProjectSelect
                  id="upload-deck"
                  ariaLabel="Select deck"
                  disabled={isLoadingDecks || isProcessing}
                  value={selectedDeckId ?? ''}
                  placeholder={isLoadingDecks ? 'Loading decks...' : 'No deck selected'}
                  options={[
                    { value: '', label: 'None' },
                    ...decks.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                  onChange={(nextId) => setSelectedDeckId(nextId || null)}
                />
              </div>
            )}
          </GlassCard>

          {/* Input area */}
          <GlassCard className="flex-1 flex flex-col">
            {/* Input tab toggle */}
            <div
              className="flex rounded-lg p-0.5 mb-4"
              role="tablist"
              aria-label="Input method"
              style={{ backgroundColor: 'var(--bg-surface-hover)' }}
            >
              {([
                { key: 'audio' as InputTab, label: 'Audio File', icon: FileAudio },
                { key: 'text' as InputTab, label: 'Text Script', icon: FileText },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={inputTab === key}
                  onClick={() => {
                    setInputTab(key);
                    setError(null);
                  }}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200"
                  style={{
                    backgroundColor: inputTab === key ? 'var(--bg-surface)' : 'transparent',
                    color: inputTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: inputTab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Audio file drop zone */}
            {inputTab === 'audio' && (
              <UploadDropZone
                file={file}
                onFileSelect={setFile}
                onFileRemove={() => {
                  setFile(null);
                  setError(null);
                }}
                disabled={isProcessing}
              />
            )}

            {/* Text transcript input */}
            {inputTab === 'text' && (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setError(null);
                  }}
                  disabled={isProcessing}
                  maxLength={MAX_TRANSCRIPT_LENGTH}
                  placeholder="Paste or type your pitch script here...&#10;&#10;e.g. &quot;We're building an AI-powered platform that helps founders practice and refine their investor pitches...&quot;"
                  className="flex-1 min-h-[200px] w-full rounded-xl border p-4 text-sm leading-relaxed resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff5941] focus:ring-offset-1"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    {transcript.trim().length < MIN_TRANSCRIPT_LENGTH && transcript.trim().length > 0
                      ? `At least ${MIN_TRANSCRIPT_LENGTH} characters required`
                      : 'Paste your pitch transcript or script'}
                  </span>
                  <span>{transcript.trim().length} chars</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-4 px-3 py-2 rounded-lg text-xs"
                style={{
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {error}
              </div>
            )}

            {/* Progress indicator */}
            {isProcessing && (
              <div
                aria-live="polite"
                className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-sm"
                style={{
                  color: '#ff5941',
                  backgroundColor: 'rgba(255, 89, 65, 0.06)',
                  border: '1px solid rgba(255, 89, 65, 0.15)',
                }}
              >
                <Loader2 size={14} className="animate-spin flex-shrink-0" />
                {STAGE_LABELS[stage]}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: canAnalyze
                  ? 'linear-gradient(135deg, #ff5941, #ffaa33)'
                  : 'var(--bg-surface-hover)',
                color: canAnalyze ? '#fff' : 'var(--text-muted)',
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                opacity: canAnalyze ? 1 : 0.6,
              }}
            >
              {isProcessing ? 'Processing...' : inputTab === 'audio' ? 'Upload & Analyze' : 'Analyze Script'}
            </button>
          </GlassCard>
        </div>

        {/* Right column: Tips */}
        <div className="lg:w-80 flex-shrink-0">
          <GlassCard>
            <button
              onClick={() => setTipsExpanded((prev) => !prev)}
              className="flex items-center justify-between w-full text-left"
              aria-expanded={tipsExpanded}
              aria-controls="recording-tips"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 170, 51, 0.12)' }}
                >
                  <Lightbulb size={14} style={{ color: '#ffaa33' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Recording Tips
                </span>
              </div>
              {tipsExpanded ? (
                <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>

            <div
              id="recording-tips"
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: tipsExpanded ? '300px' : '0',
                marginTop: tipsExpanded ? '12px' : '0',
                opacity: tipsExpanded ? 1 : 0,
              }}
            >
              <ul className="flex flex-col gap-2.5">
                {TIPS.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                      style={{
                        backgroundColor: 'rgba(255, 170, 51, 0.1)',
                        color: '#ffaa33',
                      }}
                    >
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>

          {/* What to expect */}
          <GlassCard className="mt-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              What to expect
            </h3>
            <ul className="flex flex-col gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {inputTab === 'audio' && (
                <li>Your recording will be transcribed automatically</li>
              )}
              {inputTab === 'text' && (
                <li>Your script will be analyzed as-is (no delivery metrics)</li>
              )}
              <li>AI analysis scores your pitch across 5 categories</li>
              <li>Get ranked fixes and a rewritten script</li>
              <li>Uses 1 analysis credit</li>
            </ul>
          </GlassCard>
        </div>
      </div>

      <AnalyzingOverlay isVisible={stage === 'analyzing'} />
    </main>
  );
}
