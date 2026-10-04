'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/AppShell';
import InfoTip from '@/components/InfoTip';
import StudentFocusTags from '@/components/StudentFocusTags';
import StudentHubNotes from '@/components/StudentHubNotes';
import { getStudentHubData, type StudentHubData, type AssessmentDetailRow } from '@/lib/student-hub';
import { printStudentHubRecord } from '@/lib/student-hub-print';
import { getColorClass, getColorLevel } from '@/lib/calculations';
import { subscribeSyncStatus } from '@/lib/sync';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

function scoreBg(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-500';
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function formatPct(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(0)}%`;
}

function AssessmentSection({
  title,
  average,
  rows,
}: {
  title: string;
  average: number | null;
  rows: AssessmentDetailRow[];
}) {
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[var(--cace-navy)]">{title}</h2>
        {average !== null && (
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${scoreBg(average)}`}>
            Avg: {formatPct(average)}
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No {title.toLowerCase()} tests recorded</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(row => (
            <li key={row.testId} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-medium text-gray-800">{row.testName}</span>
                  <span className="text-xs text-gray-500 ml-2">{row.date}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${scoreBg(row.percent)}`}>
                  {row.score}/{row.totalPoints} ({formatPct(row.percent)})
                </span>
              </div>
              {row.comment ? (
                <p className="mt-1.5 text-sm text-gray-600 whitespace-pre-wrap">{row.comment}</p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-400 italic">No comment</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function StudentHubPage() {
  const params = useParams();
  const { setCurrentClassId } = useApp();
  const classId = params.classId as string;
  const studentId = params.studentId as string;

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StudentHubData | null>(null);

  const reload = useCallback(() => {
    setData(getStudentHubData(classId, studentId));
  }, [classId, studentId]);

  useEffect(() => {
    setMounted(true);
    setCurrentClassId(classId);
    reload();
    const unsub = subscribeSyncStatus(status => {
      if (status === 'synced') reload();
    });
    return unsub;
  }, [classId, setCurrentClassId, reload]);

  if (!mounted) {
    return (
      <div className="animate-pulse max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-500">Student not found in this class</p>
          <Link href={`/classes/${classId}/attendance`} className="btn btn-primary mt-4">
            Back to Attendance
          </Link>
        </div>
      </div>
    );
  }

  const { classData, student, totalStudents, notes, personalNotes } = data;
  const thresholds = classData.colorThresholds;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/classes/${classId}/attendance`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--cace-teal)] mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Attendance
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--cace-navy)]">{student.name}</h1>
            <InfoTip text="All stats, notes, and speaking/writing scores for this student. Add or edit notes right here. Print student record for their file folder. Print progress report opens the formal Report Cards page." />
          </div>
          <p className="text-gray-600">
            {classData.name} • {classData.schedule}
            {student.rank != null ? (
              <span className="ml-2 text-sm text-gray-500">
                Rank #{student.rank} of {totalStudents}
              </span>
            ) : (
              <span className="ml-2 text-sm text-amber-600">Incomplete for ranking</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => printStudentHubRecord(classId, studentId)}
          >
            <PrinterIcon className="w-5 h-5" />
            Print student record
          </button>
          <Link
            href={`/classes/${classId}/report-cards?student=${encodeURIComponent(studentId)}`}
            className="btn btn-primary"
          >
            <PrinterIcon className="w-5 h-5" />
            Print progress report
          </Link>
        </div>
      </div>

      <StudentHubNotes
        classId={classId}
        studentId={studentId}
        notes={notes}
        personalNotes={personalNotes}
        onChange={reload}
      />

      <StudentFocusTags studentId={studentId} onChange={reload} />

      {/* Key stats */}
      <section className="card">
        <h2 className="text-lg font-semibold text-[var(--cace-navy)] mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <StatChip
            label="CASAS Reading"
            value={
              student.casasReadingProgress != null
                ? formatPct(student.casasReadingProgress)
                : '—'
            }
            className={getColorClass(getColorLevel(student.casasReadingProgress, thresholds))}
          />
          <StatChip
            label="CASAS Listening"
            value={
              student.casasListeningProgress != null
                ? formatPct(student.casasListeningProgress)
                : '—'
            }
            className={getColorClass(getColorLevel(student.casasListeningProgress, thresholds))}
          />
          <StatChip label="Unit tests" value={formatPct(student.testAverage)} className={scoreBg(student.testAverage)} />
          <StatChip
            label="Attendance"
            value={formatPct(student.attendanceAverage)}
            className={scoreBg(student.attendanceAverage)}
          />
          <StatChip label="Speaking" value={formatPct(student.speakingAverage)} className={scoreBg(student.speakingAverage)} />
          <StatChip label="Writing" value={formatPct(student.writingAverage)} className={scoreBg(student.writingAverage)} />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-700 mb-1">CASAS Reading scores</p>
            {data.readingTests.length === 0 ? (
              <p className="text-gray-400 text-xs">None</p>
            ) : (
              <ul className="space-y-0.5">
                {[...data.readingTests]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(t => (
                    <li key={t.id}>
                      {t.date}: {t.score ?? '*'} ({t.formNumber})
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">CASAS Listening scores</p>
            {data.listeningTests.length === 0 ? (
              <p className="text-gray-400 text-xs">None</p>
            ) : (
              <ul className="space-y-0.5">
                {[...data.listeningTests]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(t => (
                    <li key={t.id}>
                      {t.date}: {t.score ?? '*'} ({t.formNumber})
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Unit tests</p>
            {data.unitTests.length === 0 ? (
              <p className="text-gray-400 text-xs">None</p>
            ) : (
              <ul className="space-y-0.5">
                {[...data.unitTests]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(t => (
                    <li key={t.id}>
                      {t.testName} ({t.date}): {t.score}%
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Attendance (by month)</p>
            {data.attendance.length === 0 ? (
              <p className="text-gray-400 text-xs">None</p>
            ) : (
              <ul className="space-y-0.5">
                {[...data.attendance]
                  .sort((a, b) => a.month.localeCompare(b.month))
                  .map(a => (
                    <li key={a.id}>
                      {a.month}: {a.percentage.toFixed(0)}%
                      {a.isVacation ? ' (vacation)' : ''}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <AssessmentSection title="Speaking" average={student.speakingAverage} rows={data.speakingRows} />
      <AssessmentSection title="Writing" average={student.writingAverage} rows={data.writingRows} />

      {/* Saved report cards */}
      <section className="card">
        <div className="flex items-center gap-2 mb-3">
          <DocumentTextIcon className="w-5 h-5 text-[var(--cace-navy)]" />
          <h2 className="text-lg font-semibold text-[var(--cace-navy)]">Saved progress reports</h2>
        </div>
        {data.reportCards.length === 0 ? (
          <p className="text-sm text-gray-400">
            None saved yet.{' '}
            <Link
              href={`/classes/${classId}/report-cards?student=${encodeURIComponent(studentId)}`}
              className="text-[var(--cace-teal)] hover:underline"
            >
              Create one
            </Link>
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {[...data.reportCards]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map(card => (
                <li key={card.id} className="flex justify-between gap-2">
                  <span className="font-medium text-gray-800">{card.periodName}</span>
                  <Link
                    href={`/classes/${classId}/report-cards?student=${encodeURIComponent(studentId)}`}
                    className="text-[var(--cace-teal)] hover:underline shrink-0"
                  >
                    Open
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <span className={`inline-block text-sm font-semibold px-2 py-0.5 rounded ${className}`}>
        {value}
      </span>
    </div>
  );
}
