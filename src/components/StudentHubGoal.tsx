'use client';

import { useEffect, useState } from 'react';
import InfoTip from '@/components/InfoTip';
import { updateStudent } from '@/lib/storage';

interface StudentHubGoalProps {
  studentId: string;
  goal: string;
  /** Reload hub data after saving. */
  onChange: () => void;
}

/** Free-text student goal on the student hub. */
export default function StudentHubGoal({ studentId, goal, onChange }: StudentHubGoalProps) {
  const [draft, setDraft] = useState(goal);
  const [saved, setSaved] = useState(false);

  // Pick up the saved goal when switching students or after a cloud sync
  useEffect(() => {
    setDraft(goal);
  }, [studentId, goal]);

  const changed = draft.trim() !== goal.trim();

  const handleSave = () => {
    updateStudent(studentId, { goal: draft.trim() });
    setSaved(true);
    onChange();
  };

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-[var(--cace-navy)]">Student Goal</h2>
        <InfoTip text="What this student is working toward. Saved with the student and printed on their student record." />
      </div>
      <textarea
        value={draft}
        onChange={e => {
          setDraft(e.target.value);
          setSaved(false);
        }}
        className="input w-full min-h-[80px] resize-y print:hidden"
        rows={3}
        placeholder="Write this student's goal..."
      />
      <p className="hidden print:block whitespace-pre-wrap text-sm text-gray-800">{goal || '—'}</p>
      <div className="mt-2 flex items-center justify-end gap-3 print:hidden">
        {saved && !changed && <span className="text-sm text-green-600">Saved</span>}
        {changed && (
          <button type="button" onClick={() => setDraft(goal)} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!changed}
          className="btn btn-primary disabled:opacity-50"
        >
          Save goal
        </button>
      </div>
    </section>
  );
}
