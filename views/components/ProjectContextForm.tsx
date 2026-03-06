'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, Loader2, AlertCircle, FileText, Target, BarChart3, StickyNote, Type, type LucideIcon } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';
import type { Project } from '@/types/project';

const DEBOUNCE_MS = 500;

interface ProjectContextFormProps {
  project: Project;
}

interface FieldConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  type: 'input' | 'textarea';
  rows?: number;
}

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Project Name', icon: Type, placeholder: 'Your startup name', type: 'input' },
  { key: 'description', label: 'Description', icon: FileText, placeholder: 'Describe your startup in one line...', type: 'textarea', rows: 2 },
  { key: 'targetMarket', label: 'Target Market', icon: Target, placeholder: 'e.g. Series A B2B SaaS founders', type: 'input' },
  { key: 'keyMetrics', label: 'Key Metrics', icon: BarChart3, placeholder: 'e.g. $2M ARR, 150% NRR, 40 enterprise clients', type: 'input' },
  { key: 'extraNotes', label: 'Extra Notes', icon: StickyNote, placeholder: 'Any other context for the AI judge...', type: 'textarea', rows: 3 },
];

export function ProjectContextForm({ project }: ProjectContextFormProps) {
  const { updateProject } = useProject();
  const [formValues, setFormValues] = useState<Record<string, string>>({
    name: project.name,
    description: project.description ?? '',
    targetMarket: project.targetMarket ?? '',
    keyMetrics: project.keyMetrics ?? '',
    extraNotes: project.extraNotes ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const lastProjectIdRef = useRef(project.id);

  useEffect(() => {
    if (project.id !== lastProjectIdRef.current) {
      lastProjectIdRef.current = project.id;
      setFormValues({
        name: project.name,
        description: project.description ?? '',
        targetMarket: project.targetMarket ?? '',
        keyMetrics: project.keyMetrics ?? '',
        extraNotes: project.extraNotes ?? '',
      });
      setSaveStatus('idle');
    }
  }, [project.id, project.name, project.description, project.targetMarket, project.keyMetrics, project.extraNotes]);

  const saveField = useCallback(async (field: string, value: string | null) => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateProject({
        projectId: project.id,
        [field]: value,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [project.id, updateProject]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFieldRef = useRef<{ field: string; value: string | null } | null>(null);

  const debouncedSave = useCallback((field: string, value: string | null) => {
    pendingFieldRef.current = { field, value };
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const pending = pendingFieldRef.current;
      if (pending) {
        pendingFieldRef.current = null;
        void saveField(pending.field, pending.value);
      }
    }, DEBOUNCE_MS);
  }, [saveField]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    const original = (project as unknown as Record<string, unknown>)[field] as string | null ?? '';
    const normalized = value || null;
    const originalNormalized = original || null;
    if (field === 'name' && !value.trim()) return;
    if (normalized !== originalNormalized) {
      debouncedSave(field, normalized);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Project Details
          </h2>
        </div>
        <div className="h-6 flex items-center">
          {isSaving ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}
            >
              <Loader2 size={11} className="animate-spin" /> Saving...
            </span>
          ) : saveStatus === 'saved' ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg"
              style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}
            >
              <Check size={11} strokeWidth={2.5} /> Saved
            </span>
          ) : saveStatus === 'error' ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg"
              style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
            >
              <AlertCircle size={11} /> Failed
            </span>
          ) : null}
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3.5">
        {FIELDS.map((field) => {
          const Icon = field.icon;
          const isFocused = focusedField === field.key;
          const value = formValues[field.key] ?? '';
          const inputStyle: React.CSSProperties = {
            backgroundColor: 'var(--bg-surface)',
            borderColor: isFocused ? 'rgba(255, 89, 65, 0.3)' : 'var(--border-color)',
            color: 'var(--text-primary)',
            boxShadow: isFocused ? '0 0 0 3px rgba(255, 89, 65, 0.06)' : 'none',
          };

          return (
            <div key={field.key}>
              <label
                className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5"
                style={{ color: isFocused ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                <Icon size={11} style={{ opacity: 0.6 }} />
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                  rows={field.rows}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 resize-none"
                  style={inputStyle}
                />
              ) : (
                <input
                  value={value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onFocus={() => setFocusedField(field.key)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
