'use client';

import { useMemo, useState } from 'react';
import {
  addTagToStudent,
  findOrCreateSkillTag,
  getSkillTags,
  getTagsForStudent,
  removeTagFromStudent,
} from '@/lib/storage';
import type { SkillTag } from '@/types';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import InfoTip from '@/components/InfoTip';

interface StudentFocusTagsProps {
  studentId: string;
  onChange?: () => void;
}

export default function StudentFocusTags({ studentId, onChange }: StudentFocusTagsProps) {
  const [version, setVersion] = useState(0);
  const [draft, setDraft] = useState('');

  const assigned = useMemo(() => getTagsForStudent(studentId), [studentId, version]);
  const allTags = useMemo(() => getSkillTags(), [version]);
  const assignedIds = useMemo(() => new Set(assigned.map(t => t.id)), [assigned]);
  const available = useMemo(
    () => allTags.filter(t => !assignedIds.has(t.id)),
    [allTags, assignedIds],
  );

  const refresh = () => {
    setVersion(v => v + 1);
    onChange?.();
  };

  const toggleOff = (tag: SkillTag) => {
    removeTagFromStudent(studentId, tag.id);
    refresh();
  };

  const toggleOn = (tag: SkillTag) => {
    addTagToStudent(studentId, tag.id);
    refresh();
  };

  const addNew = () => {
    const label = draft.trim();
    if (!label) return;
    try {
      const tag = findOrCreateSkillTag(label);
      addTagToStudent(studentId, tag.id);
      setDraft('');
      refresh();
    } catch {
      // empty label
    }
  };

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-[var(--cace-navy)]">Focus tags</h2>
        <InfoTip
          wide
          text="Tag what this student needs to work on (e.g. Short vowels, Present tense). Tags are shared across all classes. Use Dashboard → Tools → ISST groups to see tutoring groups by tag."
        />
      </div>

      <p className="text-xs text-gray-500 mb-2">On this student (click to remove)</p>
      {assigned.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">No tags yet</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {assigned.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleOff(tag)}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--cace-teal)]/15 text-[var(--cace-navy)] border border-[var(--cace-teal)]/40 px-3 py-1 text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              title="Remove tag"
            >
              {tag.label}
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <>
          <p className="text-xs text-gray-500 mb-2">Add existing tag</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {available.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleOn(tag)}
                className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 text-sm hover:bg-[var(--cace-teal)]/10 hover:border-[var(--cace-teal)]/40"
              >
                + {tag.label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-gray-500 mb-2">Create &amp; add new tag</p>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNew();
            }
          }}
          className="input flex-1 min-w-[12rem]"
          placeholder="e.g. Short vowels"
        />
        <button
          type="button"
          onClick={addNew}
          disabled={!draft.trim()}
          className="btn btn-secondary disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          Add tag
        </button>
      </div>
    </section>
  );
}
