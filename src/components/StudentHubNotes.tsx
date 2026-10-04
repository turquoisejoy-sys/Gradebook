'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import InfoTip from '@/components/InfoTip';
import { addStudentNote, deleteStudentNote, updateStudent, updateStudentNote } from '@/lib/storage';
import { StudentNote } from '@/types';

interface StudentHubNotesProps {
  classId: string;
  studentId: string;
  notes: StudentNote[];
  personalNotes: string;
  /** Reload hub data after a change. */
  onChange: () => void;
}

const todayIso = () => new Date().toISOString().split('T')[0];

/** Notes card on the student hub: add, edit, and delete dated notes, and edit the roster/personal note. */
export default function StudentHubNotes({
  classId,
  studentId,
  notes,
  personalNotes,
  onChange,
}: StudentHubNotesProps) {
  const [newDate, setNewDate] = useState(todayIso());
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalDraft, setPersonalDraft] = useState('');

  const handleAdd = () => {
    const content = newContent.trim();
    if (!content) return;
    addStudentNote(studentId, content, newDate || todayIso());
    setNewContent('');
    setNewDate(todayIso());
    onChange();
  };

  const startEdit = (note: StudentNote) => {
    setEditingId(note.id);
    setEditDate(note.date);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateStudentNote(editingId, editContent.trim(), editDate || todayIso());
    setEditingId(null);
    onChange();
  };

  const handleDelete = (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    deleteStudentNote(noteId);
    if (editingId === noteId) setEditingId(null);
    onChange();
  };

  const handleSavePersonal = () => {
    updateStudent(studentId, { notes: personalDraft.trim() });
    setEditingPersonal(false);
    onChange();
  };

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--cace-navy)]">Notes</h2>
          <InfoTip text="Dated teacher notes for this student. ISST-style comments live here too. Add, edit, or delete them right here; they also show on the Notes page." />
        </div>
        <Link
          href={`/classes/${classId}/notes#student-${studentId}`}
          className="text-sm text-[var(--cace-teal)] hover:underline print:hidden"
        >
          Notes page
        </Link>
      </div>

      {/* Roster / personal note */}
      {editingPersonal ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
          <p className="text-xs font-medium text-gray-500">Roster / personal note</p>
          <textarea
            value={personalDraft}
            onChange={e => setPersonalDraft(e.target.value)}
            className="input w-full min-h-[70px] resize-y"
            rows={3}
            placeholder="Personal notes (not shown on report cards)"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingPersonal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSavePersonal} className="btn btn-primary">
              Save
            </button>
          </div>
        </div>
      ) : personalNotes ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium text-gray-500">Roster / personal note</p>
            <button
              type="button"
              onClick={() => {
                setPersonalDraft(personalNotes);
                setEditingPersonal(true);
              }}
              className="p-1 text-gray-400 hover:text-[var(--cace-teal)] rounded print:hidden"
              title="Edit personal note"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="whitespace-pre-wrap text-gray-700">{personalNotes}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setPersonalDraft('');
            setEditingPersonal(true);
          }}
          className="mb-4 text-xs text-[var(--cace-teal)] hover:underline print:hidden"
        >
          + Add a personal note
        </button>
      )}

      {/* Add a dated note */}
      <div className="mb-4 space-y-2 print:hidden">
        <textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          className="input w-full min-h-[70px] resize-y"
          rows={3}
          placeholder="Write a new note about this student..."
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="text-xs text-gray-500" htmlFor="hub-new-note-date">
            Date
          </label>
          <input
            id="hub-new-note-date"
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newContent.trim()}
            className="btn btn-primary disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
            Add note
          </button>
        </div>
      </div>

      {/* Dated notes */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">No dated notes yet</p>
      ) : (
        <ul className="space-y-3">
          {notes.map(n => (
            <li key={n.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  />
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="input w-full min-h-[70px] resize-y"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim()}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{n.date}</span>
                    <div className="flex items-center print:hidden">
                      <button
                        type="button"
                        onClick={() => startEdit(n)}
                        className="p-1 text-gray-400 hover:text-[var(--cace-teal)] rounded"
                        title="Edit note"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="Delete note"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">{n.content}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
