'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/AppShell';
import { getClasses, getStudentsByClass } from '@/lib/storage';
import { sortStudentsByLastName } from '@/lib/calculations';
import { getStudentDisplayName } from '@/lib/student-names';
import {
  ensureFocusAreaTags,
  getIsstGroups,
  GROUP_SIZE_OPTIONS,
  groupLetter,
  ISST_SKILLS,
  moveStudentInGroups,
  printIsstGroups,
  resolveGroups,
  saveIsstGroups,
  splitIntoGroups,
  type MoveTarget,
} from '@/lib/isst-groups';
import type { Class, IsstSkill, Student } from '@/types';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  IdentificationIcon,
  PrinterIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import InfoTip from '@/components/InfoTip';

const DRAG_TYPE = 'application/x-isst-student';

interface StudentChipProps {
  student: Student;
  classId: string;
  skill: IsstSkill;
  groupCount: number;
  currentIndex: number | 'unplaced';
  onMove: (target: MoveTarget) => void;
}

/** One draggable student, with a "Move to" menu for tablets and keyboards. */
function StudentChip({ student, classId, skill, groupCount, currentIndex, onMove }: StudentChipProps) {
  return (
    <li
      draggable
      onDragStart={e => {
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ studentId: student.id, skill }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm cursor-grab active:cursor-grabbing"
    >
      <span className="flex-1 truncate" title={getStudentDisplayName(student)}>
        {getStudentDisplayName(student)}
      </span>
      <Link
        href={`/classes/${classId}/students/${student.id}`}
        className="p-0.5 text-gray-300 hover:text-[var(--cace-teal)]"
        title="Open student hub"
        draggable={false}
      >
        <IdentificationIcon className="w-4 h-4" />
      </Link>
      <select
        value=""
        onChange={e => {
          const v = e.target.value;
          if (!v) return;
          onMove(v === 'new' || v === 'unplaced' ? v : Number(v));
        }}
        className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-500 max-w-[5.5rem]"
        title="Move to another group"
      >
        <option value="">Move…</option>
        {Array.from({ length: groupCount }, (_, i) =>
          i === currentIndex ? null : (
            <option key={i} value={i}>
              Group {groupLetter(i)}
            </option>
          ),
        )}
        <option value="new">New group</option>
        {currentIndex !== 'unplaced' && <option value="unplaced">Needs a group</option>}
      </select>
    </li>
  );
}

interface DropZoneProps {
  skill: IsstSkill;
  onDropStudent: (studentId: string) => void;
  className: string;
  children: React.ReactNode;
}

/** Accepts students dragged from the same skill. */
function DropZone({ skill, onDropStudent, className, children }: DropZoneProps) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        setOver(false);
        const raw = e.dataTransfer.getData(DRAG_TYPE);
        if (!raw) return;
        const data = JSON.parse(raw) as { studentId: string; skill: IsstSkill };
        if (data.skill !== skill) return;
        e.preventDefault();
        onDropStudent(data.studentId);
      }}
      className={`${className} ${over ? 'ring-2 ring-[var(--cace-teal)] bg-teal-50/60' : ''}`}
    >
      {children}
    </div>
  );
}

function IsstGroupsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentClassId, setCurrentClassId, mounted } = useApp();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    setClasses(getClasses());
    const fromQuery = searchParams.get('classId');
    const initial =
      (fromQuery && getClasses().some(c => c.id === fromQuery) && fromQuery) ||
      currentClassId ||
      getClasses()[0]?.id ||
      '';
    setSelectedClassId(initial);
    if (initial) setCurrentClassId(initial);
  }, [mounted, searchParams, currentClassId, setCurrentClassId]);

  const selectedClass = useMemo(
    () => classes.find(c => c.id === selectedClassId) || null,
    [classes, selectedClassId],
  );

  const students = useMemo(() => {
    if (!selectedClassId) return [] as Student[];
    return sortStudentsByLastName(getStudentsByClass(selectedClassId));
  }, [selectedClassId, mounted, version]);

  const studentsById = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const tags = useMemo(() => (mounted ? ensureFocusAreaTags() : null), [mounted]);

  const saved = useMemo(
    () => (selectedClassId ? getIsstGroups(selectedClassId) : null),
    [selectedClassId, version],
  );

  const skills = useMemo(() => {
    if (!tags || !saved) return [];
    return ISST_SKILLS.map(({ key, label }) => {
      const tagId = tags[key].id;
      const taggedIds = students.filter(s => s.tagIds?.includes(tagId)).map(s => s.id);
      const built = saved[key] !== null;
      const { groups, unplaced } = resolveGroups(saved[key] ?? [], taggedIds);
      return { key, label, taggedIds, built, groups, unplaced };
    });
  }, [tags, saved, students]);

  const supportStudents = useMemo(
    () => (tags ? students.filter(s => s.tagIds?.includes(tags.support.id)) : []),
    [tags, students],
  );
  const untagged = useMemo(() => {
    if (!tags) return [];
    const focusIds = new Set(Object.values(tags).map(t => t.id));
    return students.filter(s => !(s.tagIds ?? []).some(id => focusIds.has(id)));
  }, [tags, students]);

  const save = (skill: IsstSkill, groups: string[][]) => {
    if (!saved) return;
    saveIsstGroups(selectedClassId, { ...saved, [skill]: groups });
    setVersion(v => v + 1);
  };

  const build = (skill: IsstSkill, taggedIds: string[], alreadyBuilt: boolean) => {
    if (!saved) return;
    if (alreadyBuilt && !confirm('Rebuild these groups? Everyone will be re-split and manual moves will be lost.')) {
      return;
    }
    save(skill, splitIntoGroups(taggedIds, saved.groupSize));
  };

  const move = (skill: IsstSkill, groups: string[][], studentId: string, target: MoveTarget) => {
    save(skill, moveStudentInGroups(groups, studentId, target));
  };

  const setGroupSize = (size: number) => {
    if (!saved) return;
    saveIsstGroups(selectedClassId, { ...saved, groupSize: size });
    setVersion(v => v + 1);
  };

  const onSelectClass = (id: string) => {
    setSelectedClassId(id);
    setCurrentClassId(id);
    router.push(id ? `/tools/isst-groups?classId=${encodeURIComponent(id)}` : '/tools/isst-groups');
  };

  if (!mounted) {
    return <div className="animate-pulse h-8 bg-gray-200 rounded w-48" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--cace-teal)] mb-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-7 h-7 text-[var(--cace-navy)]" />
            <h1 className="text-2xl font-bold text-[var(--cace-navy)]">ISST groups</h1>
            <InfoTip
              wide
              text="Students ticked for Speaking or Writing on their Student Hub are split into small groups you rotate through. Click Build groups once; groups stay the same until you Rebuild. Drag a student (or use Move…) to change their group. Newly tagged students wait under Needs a group."
            />
          </div>
          <p className="text-gray-600 mt-1">Speaking and Writing groups, plus your 1-1 Support list.</p>
        </div>
        {selectedClass && (
          <button
            type="button"
            onClick={() =>
              printIsstGroups(
                selectedClass.name,
                skills.map(s => ({ label: s.label, groups: s.groups, unplaced: s.unplaced })),
                supportStudents,
                studentsById,
              )
            }
            className="btn btn-secondary"
          >
            <PrinterIcon className="w-5 h-5" />
            Print groups
          </button>
        )}
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select className="input max-w-md" value={selectedClassId} onChange={e => onSelectClass(e.target.value)}>
            <option value="">Select a class…</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.academicYear} · {c.schedule})
              </option>
            ))}
          </select>
        </div>
        {saved && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max per group</label>
            <select
              className="input"
              value={saved.groupSize}
              onChange={e => setGroupSize(Number(e.target.value))}
            >
              {GROUP_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>
                  {n} students
                </option>
              ))}
            </select>
          </div>
        )}
        {saved && (
          <p className="text-xs text-gray-500 pb-2">Changing the size applies the next time you Build or Rebuild.</p>
        )}
      </div>

      {!selectedClass ? (
        <div className="card text-center py-10 text-gray-500">Select a class to see groups.</div>
      ) : (
        <>
          {skills.map(skill => (
            <section key={skill.key} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--cace-navy)]">{skill.label}</h2>
                  <p className="text-sm text-gray-500">
                    {skill.taggedIds.length} student{skill.taggedIds.length !== 1 ? 's' : ''} tagged
                    {skill.built && ` · ${skill.groups.length} group${skill.groups.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {skill.taggedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => build(skill.key, skill.taggedIds, skill.built)}
                    className={skill.built ? 'btn btn-secondary' : 'btn btn-primary'}
                  >
                    {skill.built ? <ArrowPathIcon className="w-4 h-4" /> : <UserGroupIcon className="w-4 h-4" />}
                    {skill.built ? 'Rebuild groups' : 'Build groups'}
                  </button>
                )}
              </div>

              {skill.taggedIds.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nobody tagged for {skill.label} yet. Tick it under Focus areas on a Student Hub.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {skill.groups.map((group, index) => {
                    const over = saved && group.length > saved.groupSize;
                    return (
                      <DropZone
                        key={index}
                        skill={skill.key}
                        onDropStudent={id => move(skill.key, skill.groups, id, index)}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-baseline justify-between mb-2">
                          <h3 className="font-semibold text-[var(--cace-navy)]">
                            {skill.label} {groupLetter(index)}
                          </h3>
                          <span className={`text-xs ${over ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {group.length}/{saved?.groupSize}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {group.map(id => {
                            const s = studentsById.get(id);
                            if (!s) return null;
                            return (
                              <StudentChip
                                key={id}
                                student={s}
                                classId={selectedClassId}
                                skill={skill.key}
                                groupCount={skill.groups.length}
                                currentIndex={index}
                                onMove={target => move(skill.key, skill.groups, id, target)}
                              />
                            );
                          })}
                        </ul>
                      </DropZone>
                    );
                  })}

                  {skill.unplaced.length > 0 && (
                    <DropZone
                      skill={skill.key}
                      onDropStudent={id => move(skill.key, skill.groups, id, 'unplaced')}
                      className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/60 p-3"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <h3 className="font-semibold text-amber-800">Needs a group</h3>
                        <span className="text-xs text-amber-700">{skill.unplaced.length}</span>
                      </div>
                      {!skill.built && (
                        <p className="text-xs text-amber-700 mb-2">
                          Click <strong>Build groups</strong> to split these students automatically.
                        </p>
                      )}
                      <ul className="space-y-1.5">
                        {skill.unplaced.map(id => {
                          const s = studentsById.get(id);
                          if (!s) return null;
                          return (
                            <StudentChip
                              key={id}
                              student={s}
                              classId={selectedClassId}
                              skill={skill.key}
                              groupCount={skill.groups.length}
                              currentIndex="unplaced"
                              onMove={target => move(skill.key, skill.groups, id, target)}
                            />
                          );
                        })}
                      </ul>
                    </DropZone>
                  )}

                  {skill.built && (
                    <DropZone
                      skill={skill.key}
                      onDropStudent={id => move(skill.key, skill.groups, id, 'new')}
                      className="rounded-lg border-2 border-dashed border-gray-200 p-3 flex items-center justify-center text-sm text-gray-400 min-h-[5rem]"
                    >
                      Drop here to start a new group
                    </DropZone>
                  )}
                </div>
              )}
            </section>
          ))}

          <section className="card">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-[var(--cace-navy)]">1-1 Support</h2>
              <span className="text-sm text-gray-500">
                {supportStudents.length} student{supportStudents.length !== 1 ? 's' : ''}
              </span>
            </div>
            {supportStudents.length === 0 ? (
              <p className="text-sm text-gray-400">Nobody tagged for 1-1 Support.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                {supportStudents.map(s => (
                  <li key={s.id}>
                    <Link
                      href={`/classes/${selectedClassId}/students/${s.id}`}
                      className="text-[var(--cace-teal)] hover:underline font-medium"
                    >
                      {getStudentDisplayName(s)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card border-dashed border-2 border-gray-200 bg-gray-50/80">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-gray-700">No focus area</h2>
              <span className="text-sm text-gray-500">
                {untagged.length} student{untagged.length !== 1 ? 's' : ''}
              </span>
            </div>
            {untagged.length === 0 ? (
              <p className="text-sm text-gray-400">Everyone has at least one focus area.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                {untagged.map(s => (
                  <li key={s.id}>
                    <Link
                      href={`/classes/${selectedClassId}/students/${s.id}`}
                      className="text-gray-700 hover:text-[var(--cace-teal)] hover:underline"
                    >
                      {getStudentDisplayName(s)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function IsstGroupsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-8 bg-gray-200 rounded w-48 mx-auto mt-8" />}>
      <IsstGroupsInner />
    </Suspense>
  );
}
