'use client';

import { useState, useCallback, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useProject } from '@/views/components/ProjectProvider';
import type { Project } from '@/types/project';

interface ProjectContextFormProps {
  project: Project;
}

export function ProjectContextForm({ project }: ProjectContextFormProps) {
  const { updateProject } = useProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [targetMarket, setTargetMarket] = useState(project.targetMarket ?? '');
  const [keyMetrics, setKeyMetrics] = useState(project.keyMetrics ?? '');
  const [extraNotes, setExtraNotes] = useState(project.extraNotes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? '');
    setTargetMarket(project.targetMarket ?? '');
    setKeyMetrics(project.keyMetrics ?? '');
    setExtraNotes(project.extraNotes ?? '');
  }, [project]);

  const handleSave = useCallback(async (field: string, value: string | null) => {
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

  const fieldClass = 'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors';
  const fieldStyle = {
    backgroundColor: 'var(--bg-surface)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Project Details
        </h2>
        {isSaving ? (
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={12} className="animate-spin" /> Saving...
          </span>
        ) : saveStatus === 'saved' ? (
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#22c55e' }}>
            <Save size={12} /> Saved
          </span>
        ) : saveStatus === 'error' ? (
          <span className="text-xs" style={{ color: '#ef4444' }}>Failed to save</span>
        ) : null}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name.trim() !== project.name) {
              void handleSave('name', name.trim());
            }
          }}
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== (project.description ?? '')) {
              void handleSave('description', description || null);
            }
          }}
          rows={2}
          placeholder="Describe your startup in one line..."
          className={fieldClass + ' resize-none'}
          style={fieldStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Target Market
        </label>
        <input
          value={targetMarket}
          onChange={(e) => setTargetMarket(e.target.value)}
          onBlur={() => {
            if (targetMarket !== (project.targetMarket ?? '')) {
              void handleSave('targetMarket', targetMarket || null);
            }
          }}
          placeholder="e.g. Series A B2B SaaS founders"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Key Metrics
        </label>
        <input
          value={keyMetrics}
          onChange={(e) => setKeyMetrics(e.target.value)}
          onBlur={() => {
            if (keyMetrics !== (project.keyMetrics ?? '')) {
              void handleSave('keyMetrics', keyMetrics || null);
            }
          }}
          placeholder="e.g. $2M ARR, 150% NRR, 40 enterprise clients"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Extra Notes
        </label>
        <textarea
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
          onBlur={() => {
            if (extraNotes !== (project.extraNotes ?? '')) {
              void handleSave('extraNotes', extraNotes || null);
            }
          }}
          rows={3}
          placeholder="Any other context for the AI judge..."
          className={fieldClass + ' resize-none'}
          style={fieldStyle}
        />
      </div>
    </div>
  );
}
