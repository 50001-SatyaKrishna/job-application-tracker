import React, { useState, useEffect, useRef } from 'react';

export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'next' | 'prev';

interface EditableCellProps {
  value: string | number | null;
  type?: 'text' | 'number' | 'date' | 'datetime-local';
  onSave: (newValue: any) => Promise<void> | void;
  placeholder?: string;
  formatDisplay?: (val: any) => string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  min?: number;
  max?: number;
  step?: number | string;

  // Arrow key navigation & focus management
  isActive?: boolean;
  isEditing?: boolean;
  onActivate?: () => void;
  onStartEdit?: () => void;
  onStopEdit?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  cellCoord?: { row: number; col: number };
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  type = 'text',
  onSave,
  placeholder = '—',
  formatDisplay,
  align = 'left',
  className = '',
  min,
  max,
  step,
  isActive = false,
  isEditing: controlledIsEditing,
  onActivate,
  onStartEdit,
  onStopEdit,
  onNavigate,
  cellCoord,
}) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = controlledIsEditing !== undefined ? controlledIsEditing : internalIsEditing;

  const [draft, setDraft] = useState<string>(value !== null && value !== undefined ? String(value) : '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  // Sync draft whenever upstream value changes
  useEffect(() => {
    setDraft(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  // Focus cell container when active in navigation mode
  useEffect(() => {
    if (isActive && !isEditing && cellRef.current) {
      cellRef.current.focus({ preventScroll: true });
    }
  }, [isActive, isEditing]);

  const handleStartEdit = (initialChar?: string) => {
    if (initialChar !== undefined) {
      setDraft(initialChar);
    } else {
      setDraft(value !== null && value !== undefined ? String(value) : '');
    }
    if (onStartEdit) {
      onStartEdit();
    } else {
      setInternalIsEditing(true);
    }
  };

  const handleStopEdit = () => {
    if (onStopEdit) {
      onStopEdit();
    } else {
      setInternalIsEditing(false);
    }
  };

  const handleCommit = async () => {
    if (!isEditing) return;
    handleStopEdit();

    let parsedValue: any = draft.trim();
    if (type === 'number') {
      if (parsedValue === '') {
        parsedValue = null;
      } else {
        const num = Number(parsedValue);
        parsedValue = isNaN(num) ? null : num;
      }
    } else if (type === 'date' || type === 'datetime-local') {
      if (parsedValue === '') {
        parsedValue = null;
      }
    } else {
      if (parsedValue === '') {
        parsedValue = '';
      }
    }

    // Compare with current value
    const hasChanged = String(parsedValue ?? '') !== String(value ?? '');
    if (hasChanged) {
      try {
        setIsSaving(true);
        await onSave(parsedValue);
      } catch {
        // revert to original on error
        setDraft(value !== null && value !== undefined ? String(value) : '');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Keyboard navigation when in Edit Mode (inside the input)
  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleCommit();
      onNavigate?.(e.shiftKey ? 'up' : 'down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      await handleCommit();
      onNavigate?.(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft(value !== null && value !== undefined ? String(value) : '');
      handleStopEdit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      await handleCommit();
      onNavigate?.('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      await handleCommit();
      onNavigate?.('down');
    } else if (e.key === 'ArrowLeft') {
      // Navigate to left cell if cursor is at the very beginning or with Alt key
      const atStart = inputRef.current
        ? inputRef.current.selectionStart === 0 && inputRef.current.selectionEnd === 0
        : false;
      if (atStart || e.altKey) {
        e.preventDefault();
        await handleCommit();
        onNavigate?.('left');
      }
    } else if (e.key === 'ArrowRight') {
      // Navigate to right cell if cursor is at the end or with Alt key
      const atEnd = inputRef.current
        ? inputRef.current.selectionStart === draft.length
        : false;
      if (atEnd || e.altKey) {
        e.preventDefault();
        await handleCommit();
        onNavigate?.('right');
      }
    }
  };

  // Keyboard navigation when in Navigation Mode (cell focused, not editing)
  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate?.('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate?.('down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onNavigate?.('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNavigate?.('right');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onNavigate?.(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      handleStartEdit();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleStartEdit('');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Quick start typing into the cell on any character key
      e.preventDefault();
      handleStartEdit(e.key);
    }
  };

  const getDisplayContent = () => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-300 dark:text-slate-600 font-normal select-none">{placeholder}</span>;
    }
    if (formatDisplay) {
      return formatDisplay(value);
    }
    if (type === 'datetime-local' && typeof value === 'string') {
      return value.replace('T', ' ');
    }
    return String(value);
  };

  const alignClass =
    align === 'right' ? 'text-right justify-end' : align === 'center' ? 'text-center justify-center' : 'text-left justify-start';

  const cellId = cellCoord ? `cell-${cellCoord.row}-${cellCoord.col}` : undefined;
  const dataCell = cellCoord ? `${cellCoord.row}-${cellCoord.col}` : undefined;

  if (isEditing) {
    return (
      <div
        id={cellId}
        data-cell={dataCell}
        className="relative w-full h-full flex items-center p-0.5"
      >
        <input
          ref={inputRef}
          type={type}
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleInputKeyDown}
          className={`w-full h-8 px-2 py-1 text-sm bg-white dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-400 rounded outline-none ring-2 ring-blue-100 dark:ring-blue-900/60 text-slate-900 dark:text-slate-100 shadow-sm z-20 ${
            align === 'right' ? 'text-right' : 'text-left'
          }`}
        />
      </div>
    );
  }

  return (
    <div
      ref={cellRef}
      id={cellId}
      data-cell={dataCell}
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        if (isActive) {
          handleStartEdit();
        } else {
          onActivate?.();
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        handleStartEdit();
      }}
      onKeyDown={handleCellKeyDown}
      title="Click or press Enter to edit (Arrow keys navigate)"
      className={`group relative w-full h-full min-h-[36px] flex items-center px-2 py-1.5 cursor-pointer rounded outline-none transition-colors ${alignClass} ${className} ${
        isActive
          ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset bg-blue-50/70 dark:bg-blue-950/50 z-10'
          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-transparent'
      } ${isSaving ? 'opacity-50 animate-pulse' : ''}`}
    >
      <span className="truncate text-sm text-slate-700 dark:text-slate-200 pointer-events-none select-none">
        {getDisplayContent()}
      </span>
      {isSaving && (
        <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
      )}
    </div>
  );
};
