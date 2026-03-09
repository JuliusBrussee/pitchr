'use client';

import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

export interface ProjectSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface ProjectSelectProps {
  value: string;
  options: ProjectSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel: string;
  id?: string;
  compact?: boolean;
  portal?: boolean;
}

export function ProjectSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  ariaLabel,
  id,
  compact = false,
  portal = false,
}: ProjectSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
  const listboxId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!isOpen) return;
    const pointerHandler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (portal && panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('pointerdown', pointerHandler);
    return () => document.removeEventListener('pointerdown', pointerHandler);
  }, [isOpen, portal]);

  // Position the portal panel below the trigger
  useEffect(() => {
    if (!portal || !isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPortalStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: 'auto',
      right: window.innerWidth - rect.right,
      zIndex: 9999,
      width: Math.max(rect.width, 200),
    });
  }, [portal, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, selectedIndex]);

  const openWithIndex = (index: number) => {
    if (disabled || options.length === 0) return;
    setIsOpen(true);
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)));
  };

  const selectIndex = (index: number) => {
    const nextOption = options[index];
    if (!nextOption) return;
    if (nextOption.value !== value) {
      onChange(nextOption.value);
    }
    setIsOpen(false);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        openWithIndex(selectedIndex >= 0 ? selectedIndex : 0);
        return;
      }
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openWithIndex(selectedIndex >= 0 ? selectedIndex : options.length - 1);
        return;
      }
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        openWithIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        selectIndex(activeIndex);
      }
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`project-select ${compact ? 'project-select--compact' : ''}`}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? `${listboxId}-option-${activeIndex}` : undefined}
        disabled={disabled || options.length === 0}
        onClick={() => {
          if (disabled || options.length === 0) return;
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={onTriggerKeyDown}
        className="project-select-trigger"
      >
        <span className="project-select-trigger__label">
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className="project-select-trigger__chevron" />
      </button>

      {isOpen ? (() => {
        const panel = (
          <div
            ref={portal ? panelRef : undefined}
            id={listboxId}
            role="listbox"
            className={`project-select-panel project-select-panel-enter ${compact ? 'project-select--compact-panel' : ''}`}
            aria-label={ariaLabel}
            style={portal ? portalStyle : undefined}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`project-select-option ${isSelected ? 'is-selected' : ''} ${isActive ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectIndex(index)}
                >
                  <span className="project-select-option__copy">
                    <span className="project-select-option__label">{option.label}</span>
                    {option.description ? (
                      <span className="project-select-option__description">{option.description}</span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <span className="project-select-option__icon" aria-hidden="true">
                      <Check size={13} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
        return portal ? createPortal(panel, document.body) : panel;
      })() : null}
    </div>
  );
}
