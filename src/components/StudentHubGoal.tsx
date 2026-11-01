'use client';

import { useEffect, useState } from 'react';
import InfoTip from '@/components/InfoTip';
import { updateStudent } from '@/lib/storage';
import { TOPS_GOALS } from '@/lib/tops-goals';

interface StudentHubGoalProps {
  studentId: string;
  goal: string;
  topsGoal: string;
  /** Reload hub data after saving. */
  onChange: () => void;
}

/** Official TOPS goal (dropdown) plus the student's goal in their own words (free text). */
export default function StudentHubGoal({ studentId, goal, topsGoal, onChange }: StudentHubGoalProps) {
  const [draft, setDraft] = useState(goal);
  const [saved, setSaved] = useState(false);
  const [topsSaved, setTopsSaved] = useState(false);

  useEffect(() => {
    setTopsSaved(false);
  }, [studentId]);

  // Keep a saved value that is no longer on the list visible instead of blanking it
  const topsOptions: string[] =
    topsGoal && !(TOPS_GOALS as readonly string[]).includes(topsGoal) ? [...TOPS_GOALS, topsGoal] : [...TOPS_GOALS];

  const handleTopsChange = (value: string) => {
    updateStudent(studentId, { topsGoal: value });
    setTopsSaved(true);
    onChange();
  };

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
        <InfoTip text="Pick the official TOPS goal to enter in TOPS (saves right away), and write the goal in the student's own words below. Both print on the student record; print TOPS goals for the whole class from Student Notes." />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor={`tops-goal-${studentId}`} className="text-sm font-medium text-gray-700">
          TOPS goal
        </label>
        <select
          id={`tops-goal-${studentId}`}
          value={topsGoal}
          onChange={e => handleTopsChange(e.target.value)}
          className="input py-1.5 text-sm w-auto min-w-[14rem] print:hidden"
        >
          <option value="">Select TOPS goal…</option>
          {topsOptions.map(g => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <span className="hidden print:inline text-sm text-gray-800">{topsGoal || '—'}</span>
        {topsSaved && <span className="text-sm text-green-600 print:hidden">Saved</span>}
      </div>
      <label htmlFor={`goal-text-${studentId}`} className="block text-sm font-medium text-gray-700 mb-1 print:hidden">
        In the student&apos;s words
      </label>
      <textarea
        id={`goal-text-${studentId}`}
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
