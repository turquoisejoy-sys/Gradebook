/**
 * Shared data loader for the per-student hub (and reusable assessment rows).
 */

import {
  getClasses,
  getStudentsByClass,
  getCASASTestsByStudent,
  getUnitTestsByStudent,
  getAttendanceByStudent,
  getNotesByStudent,
  getSpeakingTestsByClass,
  getSpeakingTestResults,
  getWritingTestsByClass,
  getWritingTestResults,
  getReportCardsByStudent,
} from '@/lib/storage';
import { getStudentsWithRanks } from '@/lib/calculations';
import type {
  Class,
  StudentWithStats,
  CASASTest,
  UnitTest,
  Attendance,
  StudentNote,
  ReportCard,
  SpeakingTest,
  WritingTest,
} from '@/types';

export type AssessmentDetailRow = {
  testId: string;
  testName: string;
  date: string;
  score: number;
  totalPoints: number;
  percent: number;
  comment: string;
};

export function getAssessmentDetailRows(
  studentId: string,
  tests: Array<Pick<SpeakingTest | WritingTest, 'id' | 'title' | 'date' | 'totalPoints'>>,
  results: Array<{ testId: string; studentId: string; score: number | null; comment?: string }>,
): AssessmentDetailRow[] {
  const sorted = [...tests].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  );
  return sorted.flatMap(test => {
    const result = results.find(r => r.testId === test.id && r.studentId === studentId);
    if (!result || result.score === null || test.totalPoints <= 0) return [];
    const percent = Math.max(0, Math.min(100, (result.score / test.totalPoints) * 100));
    return [
      {
        testId: test.id,
        testName: test.title,
        date: test.date,
        score: result.score,
        totalPoints: test.totalPoints,
        percent,
        comment: (result.comment || '').trim(),
      },
    ];
  });
}

export interface StudentHubData {
  classData: Class;
  student: StudentWithStats;
  totalStudents: number;
  readingTests: CASASTest[];
  listeningTests: CASASTest[];
  unitTests: UnitTest[];
  attendance: Attendance[];
  notes: StudentNote[];
  personalNotes: string;
  speakingRows: AssessmentDetailRow[];
  writingRows: AssessmentDetailRow[];
  reportCards: ReportCard[];
}

export function getStudentHubData(classId: string, studentId: string): StudentHubData | null {
  const classData = getClasses().find(c => c.id === classId);
  if (!classData) return null;

  const roster = getStudentsByClass(classId);
  const ranked = getStudentsWithRanks(roster, classData);
  const student = ranked.find(s => s.id === studentId);
  if (!student) return null;

  const speakingTests = getSpeakingTestsByClass(classId);
  const writingTests = getWritingTestsByClass(classId);

  return {
    classData,
    student,
    totalStudents: ranked.length,
    readingTests: getCASASTestsByStudent(studentId, 'reading'),
    listeningTests: getCASASTestsByStudent(studentId, 'listening'),
    unitTests: getUnitTestsByStudent(studentId),
    attendance: getAttendanceByStudent(studentId),
    notes: getNotesByStudent(studentId).sort((a, b) => b.date.localeCompare(a.date)),
    personalNotes: student.notes?.trim() || '',
    speakingRows: getAssessmentDetailRows(studentId, speakingTests, getSpeakingTestResults()),
    writingRows: getAssessmentDetailRows(studentId, writingTests, getWritingTestResults()),
    reportCards: getReportCardsByStudent(studentId),
  };
}
