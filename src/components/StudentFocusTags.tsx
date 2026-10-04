'use client';

import { useMemo, useState } from 'react';
import { addTagToStudent, getStudents, removeTagFromStudent } from '@/lib/storage';
import { ensureFocusAreaTags, FOCUS_AREAS } from '@/lib/isst-groups';
import InfoTip from '@/components/InfoTip';

interface StudentFocusTagsProps {
  studentId: string;
  onChange?: () => void;
}

/** Focus areas on the student hub: Speaking, Writing, 1-1 Support (any combination). */
export default function StudentFocusTags({ studentId, onChange }: StudentFocusTagsProps) {
  const [version, setVersion] = useState(0);

  const tags = useMemo(() => ensureFocusAreaTags(), []);
  const tagIds = useMemo(
    () => new Set(getStudents().find(s => s.id === studentId)?.tagIds ?? []),
    [studentId, version],
  );

  const toggle = (tagId: string, on: boolean) => {
    if (on) addTagToStudent(studentId, tagId);
    else removeTagFromStudent(studentId, tagId);
    setVersion(v => v + 1);
    onChange?.();
  };

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-[var(--cace-navy)]">Focus areas</h2>
        <InfoTip
          wide
          text="Tick what this student needs help with. Speaking and Writing students are placed in ISST groups (Dashboard → Tools → ISST groups); 1-1 Support students are listed separately."
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {FOCUS_AREAS.map(area => {
          const tag = tags[area.key];
          const checked = tagIds.has(tag.id);
          return (
            <label
              key={area.key}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                checked
                  ? 'bg-[var(--cace-teal)]/15 border-[var(--cace-teal)]/50 text-[var(--cace-navy)] font-medium'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-[var(--cace-teal)]/40'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={e => toggle(tag.id, e.target.checked)}
                className="rounded border-gray-300 text-[var(--cace-teal)] focus:ring-[var(--cace-teal)]"
              />
              {area.label}
            </label>
          );
        })}
      </div>
    </section>
  );
}
