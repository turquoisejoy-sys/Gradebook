'use client';

import { useEffect, useState } from 'react';
import { ArrowRightIcon, ArrowRightStartOnRectangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  getClasses,
  createStudent,
  updateStudent,
  dropStudent,
  promoteStudent,
  transferStudent,
  transferStudentOut,
} from '@/lib/storage';
import { buildStudentDisplayName } from '@/lib/student-names';
import { Student } from '@/types';

export type RosterAction =
  | { type: 'add' }
  | { type: 'edit'; student: Student }
  | { type: 'leave'; student: Student }
  | { type: 'transfer'; student: Student };

interface StudentRosterModalsProps {
  classId: string;
  action: RosterAction | null;
  onClose: () => void;
  /** Called after the roster changed (student added, edited, dropped, promoted, or transferred). */
  onChanged: () => void;
}

const todayIso = () => new Date().toISOString().split('T')[0];

/** Add / edit / leave-class / transfer dialogs for a class roster. */
export default function StudentRosterModals({
  classId,
  action,
  onClose,
  onChanged,
}: StudentRosterModalsProps) {
  const [current, setCurrent] = useState<RosterAction | null>(action);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [enrollment, setEnrollment] = useState(todayIso());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setCurrent(action);
    if (action?.type === 'add') {
      setFirstName('');
      setLastName('');
      setEnrollment(todayIso());
      setNotes('');
    } else if (action?.type === 'edit') {
      const s = action.student;
      setFirstName(s.firstName?.trim() || s.name.split(' ')[0] || '');
      setLastName(s.lastName?.trim() || s.name.split(' ').slice(1).join(' ') || '');
      setEnrollment(s.enrollmentDate);
      setNotes(s.notes);
    }
  }, [action]);

  if (!current) return null;

  // Only offer classes from the same school year as this class
  const allClasses = getClasses();
  const thisYear = allClasses.find(c => c.id === classId)?.academicYear;
  const otherClasses = allClasses.filter(c => c.id !== classId && c.academicYear === thisYear);

  const finish = () => {
    onChanged();
    onClose();
  };

  const handleSave = () => {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) return;
    if (current.type === 'add') {
      createStudent({ firstName: first, lastName: last }, classId, enrollment);
    } else if (current.type === 'edit') {
      updateStudent(current.student.id, {
        firstName: first,
        lastName: last,
        name: buildStudentDisplayName(first, last),
        enrollmentDate: enrollment,
        notes,
      });
    }
    finish();
  };

  if (current.type === 'add' || current.type === 'edit') {
    const isAdd = current.type === 'add';
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{isAdd ? 'Add Student' : 'Edit Student'}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder={isAdd ? 'e.g., Abner Josue' : undefined}
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder={isAdd ? 'e.g., Moreno' : undefined}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
              <input
                type="date"
                value={enrollment}
                onChange={e => setEnrollment(e.target.value)}
                className="input"
              />
            </div>
            {!isAdd && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Personal notes (not shown on report cards)"
                  className="input min-h-[80px] resize-y"
                  rows={3}
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!firstName.trim() || !lastName.trim()}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {isAdd ? 'Add Student' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { student } = current;

  if (current.type === 'transfer') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Transfer student</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Transfer <strong>{student.name}</strong> and all their data to:
          </p>
          <div className="space-y-2">
            {otherClasses.map(cls => (
              <button
                key={cls.id}
                onClick={() => {
                  transferStudent(student.id, cls.id);
                  finish();
                }}
                className="w-full p-3 text-left rounded-lg border hover:bg-[var(--cace-gray)] hover:border-[var(--cace-teal)] transition-colors"
              >
                <span className="font-medium">{cls.name}</span>
                <span className="text-gray-500 ml-2">({cls.schedule})</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="btn btn-secondary w-full mt-4">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Leave class: promote, transfer, or drop
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-2">Leave this class</h2>
        <p className="text-gray-600 mb-6">
          What happened with <strong>{student.name}</strong>?
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              promoteStudent(student.id);
              finish();
            }}
            className="w-full p-4 text-left rounded-lg border-2 border-[var(--cace-teal)]/40 bg-teal-50/80 hover:bg-teal-50 transition-colors"
          >
            <span className="font-semibold text-[var(--cace-navy)]">Promoted</span>
            <p className="text-sm text-gray-600 mt-1">
              Left successfully (e.g. next level). Does not count against retention. Listed under Promoted Students.
            </p>
          </button>
          {otherClasses.length > 0 ? (
            <button
              type="button"
              onClick={() => setCurrent({ type: 'transfer', student })}
              className="w-full p-4 text-left rounded-lg border-2 border-blue-200 bg-blue-50/70 hover:bg-blue-50 transition-colors"
            >
              <span className="font-semibold text-[var(--cace-navy)] inline-flex items-center gap-2">
                <ArrowRightIcon className="w-5 h-5 text-blue-600 shrink-0" />
                Transfer to another class
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Same program, different section/level. All scores, attendance, notes, and report cards stay on
                their record. Does not count against retention for <em>this</em> class.
              </p>
            </button>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Transfer</span> — add another class for this school
              year first (Dashboard) to move students between sections.
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              transferStudentOut(student.id);
              finish();
            }}
            className="w-full p-4 text-left rounded-lg border-2 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 transition-colors"
          >
            <span className="font-semibold text-[var(--cace-navy)] inline-flex items-center gap-2">
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 text-indigo-600 shrink-0" />
              Transferred to another teacher/class
            </span>
            <p className="text-sm text-gray-600 mt-1">
              Changed schedule to a teacher/class outside this gradebook. Not a drop — does not count against
              retention. Listed under Promoted Students (Transferred out).
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              dropStudent(student.id);
              finish();
            }}
            className="w-full p-4 text-left rounded-lg border-2 border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors"
          >
            <span className="font-semibold text-red-800">Dropped</span>
            <p className="text-sm text-gray-600 mt-1">
              Stopped attending. Counts in retention if they don&apos;t return. Listed under Dropped Students.
            </p>
          </button>
        </div>
        <button type="button" onClick={onClose} className="btn btn-secondary w-full mt-4">
          Cancel
        </button>
      </div>
    </div>
  );
}
