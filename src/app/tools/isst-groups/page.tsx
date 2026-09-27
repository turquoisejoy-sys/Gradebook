'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/AppShell';
import { getClasses, getSkillTags, getStudentsByClass } from '@/lib/storage';
import { sortStudentsByLastName } from '@/lib/calculations';
import type { Class, SkillTag, Student } from '@/types';
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import InfoTip from '@/components/InfoTip';

function IsstGroupsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentClassId, setCurrentClassId, mounted } = useApp();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');

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
  }, [selectedClassId, mounted]);

  const tags = useMemo(() => getSkillTags(), [mounted, selectedClassId, students]);

  const groups = useMemo(() => {
    const byTag: { tag: SkillTag; members: Student[] }[] = [];
    for (const tag of tags) {
      const members = students.filter(s => (s.tagIds || []).includes(tag.id));
      if (members.length > 0) {
        byTag.push({ tag, members });
      }
    }
    const untagged = students.filter(s => !s.tagIds || s.tagIds.length === 0);
    return { byTag, untagged };
  }, [tags, students]);

  const onSelectClass = (id: string) => {
    setSelectedClassId(id);
    setCurrentClassId(id);
    if (id) {
      router.push(`/tools/isst-groups?classId=${encodeURIComponent(id)}`);
    } else {
      router.push('/tools/isst-groups');
    }
  };

  if (!mounted) {
    return <div className="animate-pulse h-8 bg-gray-200 rounded w-48" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            text="Students are grouped by focus tags you set on each Student Hub. Tags are shared across classes. Use this page to form tutoring / skill-clinic groups."
          />
        </div>
        <p className="text-gray-600 mt-1">
          Tutoring and skill-clinic groups from student focus tags.
        </p>
      </div>

      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
        <select
          className="input max-w-md"
          value={selectedClassId}
          onChange={e => onSelectClass(e.target.value)}
        >
          <option value="">Select a class…</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.academicYear} · {c.schedule})
            </option>
          ))}
        </select>
      </div>

      {!selectedClass ? (
        <div className="card text-center py-10 text-gray-500">Select a class to see groups.</div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {selectedClass.name} · {students.length} active student
            {students.length !== 1 ? 's' : ''}
            {tags.length === 0 && (
              <span className="block mt-1 text-amber-700">
                No tags yet. Open a student hub and add focus tags first.
              </span>
            )}
          </p>

          {groups.byTag.length === 0 && groups.untagged.length === students.length && students.length > 0 && (
            <div className="card text-sm text-gray-600">
              Nobody in this class has tags yet. Tag students from their Student Hub pages.
            </div>
          )}

          <div className="space-y-4">
            {groups.byTag.map(({ tag, members }) => (
              <section key={tag.id} className="card">
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-[var(--cace-navy)]">{tag.label}</h2>
                  <span className="text-sm text-gray-500">
                    {members.length} student{members.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {members.map(s => (
                    <li key={s.id}>
                      <Link
                        href={`/classes/${selectedClassId}/students/${s.id}`}
                        className="text-[var(--cace-teal)] hover:underline font-medium"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="card border-dashed border-2 border-gray-200 bg-gray-50/80">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-gray-700">Untagged</h2>
                <span className="text-sm text-gray-500">
                  {groups.untagged.length} student{groups.untagged.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Students with no focus tags — so you can see who isn&apos;t in a group yet.
              </p>
              {groups.untagged.length === 0 ? (
                <p className="text-sm text-gray-400">Everyone has at least one tag.</p>
              ) : (
                <ul className="space-y-1.5">
                  {groups.untagged.map(s => (
                    <li key={s.id}>
                      <Link
                        href={`/classes/${selectedClassId}/students/${s.id}`}
                        className="text-gray-700 hover:text-[var(--cace-teal)] hover:underline"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
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
