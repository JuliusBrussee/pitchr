'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertCircle, Check, Loader2, Save, Upload } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';
import type { Project, ProjectPromptOverrides, RubricPolicy } from '@/types/project';

const RUBRIC_CONTEXT_MAX_CHARS = 4000;

interface ProjectRubricRequirementsEditorProps {
  project: Project;
  isActive: boolean;
}

function buildPromptOverrides(
  source: ProjectPromptOverrides,
  rubricText: string,
): ProjectPromptOverrides {
  const next: ProjectPromptOverrides = { ...source };

  if (!rubricText) {
    delete next.analysis_system_prompt;
    delete next.analysis_system_prompt_meta;
    delete next.analysis_system_prompt_policy;
    return next;
  }

  next.analysis_system_prompt = rubricText;
  return next;
}

function formatCapRule(rule: RubricPolicy['hard_caps'][number]): string {
  if (rule.scope === 'all') {
    return `All categories <= ${rule.max_score}/20 when "${rule.required_term}" is missing.`;
  }
  return `${rule.category} <= ${rule.max_score}/20 when "${rule.required_term}" is missing.`;
}

export function ProjectRubricRequirementsEditor({
  project,
  isActive,
}: ProjectRubricRequirementsEditorProps) {
  const { updateProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storedText = (
    project.promptOverrides?.analysis_system_prompt?.trim() ||
    project.extraNotes?.trim() ||
    ''
  );
  const [draft, setDraft] = useState(storedText);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    setDraft(storedText);
    setError(null);
    setSaveStatus('idle');
    setUploadedFileName(null);
  }, [project.id, storedText]);

  const trimmedDraft = draft.trim();
  const trimmedStoredText = storedText.trim();
  const isDirty = trimmedDraft !== trimmedStoredText;
  const charCount = trimmedDraft.length;
  const isOverLimit = charCount > RUBRIC_CONTEXT_MAX_CHARS;
  const saveDisabled = isSaving || isOverLimit || !isDirty;

  const storedPolicy = useMemo(() => {
    const value = project.promptOverrides?.analysis_system_prompt_policy;
    if (!value || typeof value !== 'object') return null;
    const candidate = value as RubricPolicy;
    if (!Array.isArray(candidate.hard_caps) || !Array.isArray(candidate.required_terms)) {
      return null;
    }
    return candidate;
  }, [project.promptOverrides?.analysis_system_prompt_policy]);

  async function handleSave() {
    setIsSaving(true);
    setSaveStatus('idle');
    setError(null);
    try {
      await updateProject({
        projectId: project.id,
        extraNotes: trimmedDraft || null,
        promptOverrides: buildPromptOverrides(project.promptOverrides ?? {}, trimmedDraft),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
    } catch (caughtError) {
      setSaveStatus('error');
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save rubric.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setDraft(text);
      setUploadedFileName(file.name);
      setError(null);
    } catch {
      setError('Failed to read rubric file.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Scoring Requirements
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            What should the AI judge explicitly check for in this pitch? Paste your rubric or key constraints here.
          </p>
        </div>
        {isSaving ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}>
            <Loader2 size={11} className="animate-spin" /> Saving...
          </span>
        ) : saveStatus === 'saved' ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
            <Check size={11} strokeWidth={2.5} /> Saved
          </span>
        ) : saveStatus === 'error' ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
            <AlertCircle size={11} /> Save failed
          </span>
        ) : null}
      </div>

      {!isActive ? (
        <div className="rounded-lg border px-3 py-2 text-xs mb-3" style={{ borderColor: 'rgba(245,158,11,0.35)', backgroundColor: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
          This project is not active. Runs from other projects will not use this rubric.
        </div>
      ) : null}

      <textarea
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
          if (saveStatus === 'saved') setSaveStatus('idle');
        }}
        rows={8}
        placeholder="Example: Must mention SOC2 and 18-month runway. If those are missing, evidence cannot exceed 8/20."
        className="w-full rounded-xl border px-4 py-3 text-xs font-mono outline-none resize-y transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: isOverLimit ? '#ef4444' : 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors duration-150 hover:bg-[var(--bg-surface)]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Upload size={12} />
            Upload `.txt` / `.md`
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={handleFileInputChange}
            className="hidden"
          />
          {uploadedFileName ? (
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Loaded {uploadedFileName}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          disabled={saveDisabled}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{
            backgroundColor: saveDisabled ? 'var(--bg-surface)' : '#ff5941',
            border: saveDisabled ? '1px solid var(--border-color)' : '1px solid rgba(255, 89, 65, 0.35)',
            color: saveDisabled ? 'var(--text-muted)' : 'white',
            cursor: saveDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={12} />
          Save Requirements
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span style={{ color: isOverLimit ? '#ef4444' : 'var(--text-muted)' }}>
          {charCount.toLocaleString()} / {RUBRIC_CONTEXT_MAX_CHARS.toLocaleString()} chars
        </span>
        {!isDirty ? (
          <span style={{ color: 'var(--text-muted)' }}>No unsaved changes</span>
        ) : (
          <span style={{ color: '#ffaa33' }}>Unsaved changes</span>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border px-3 py-2 text-xs mt-3" style={{ borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
          {error}
        </div>
      ) : null}

      {storedPolicy && !isDirty && trimmedStoredText.length > 0 ? (
        <div className="rounded-lg border px-3 py-3 text-xs mt-3" style={{ borderColor: 'rgba(96,165,250,0.35)', backgroundColor: 'rgba(96,165,250,0.08)', color: '#93c5fd' }}>
          <p className="font-semibold mb-1">Parsed Enforcement Rules</p>
          <p className="mb-1">Required mentions: {storedPolicy.required_terms.length > 0 ? storedPolicy.required_terms.join(', ') : 'none detected'}</p>
          {storedPolicy.hard_caps.slice(0, 5).map((rule) => (
            <p key={rule.id} className="mb-1">- {formatCapRule(rule)}</p>
          ))}
          {storedPolicy.parse_warnings.length > 0 ? (
            <p className="mt-2" style={{ color: '#f59e0b' }}>
              Parse warnings: {storedPolicy.parse_warnings.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
