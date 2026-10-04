// ============================================
// ESL Gradebook Types
// ============================================

// CACE Levels with CASAS score ranges
export type CACELevel = 0 | 1 | 2 | 3 | 4 | 5;

export const CACE_LEVELS: Record<CACELevel, {
  name: string;
  readingRange: [number, number];
  listeningRange: [number, number];
}> = {
  0: { name: '0 - Literacy', readingRange: [0, 183], listeningRange: [0, 181] },
  1: { name: '1 - Beginning Low', readingRange: [184, 196], listeningRange: [182, 191] },
  2: { name: '2 - Beginning High', readingRange: [197, 206], listeningRange: [192, 201] },
  3: { name: '3 - Intermediate Low', readingRange: [207, 216], listeningRange: [202, 211] },
  4: { name: '4 - Intermediate High', readingRange: [217, 227], listeningRange: [212, 221] },
  5: { name: '5 - Advanced', readingRange: [228, 238], listeningRange: [222, 231] },
};

// Class (Morning, Evening, etc.)
export type IsstSkill = 'speaking' | 'writing';

/** Saved ISST sub-groups for one class: lists of student ids per group, per skill. */
export interface IsstGroups {
  /** Max students per group (5 or 6). */
  groupSize: number;
  /** null until "Build groups" has been clicked for that skill. */
  speaking: string[][] | null;
  writing: string[][] | null;
}

export interface Class {
  id: string;
  name: string;
  academicYear: string; // e.g., "2025-2026"
  schedule: string; // "Morning" | "Evening"
  level: CACELevel; // CACE Level (0-5)
  // CASAS Level Configuration (auto-set based on level)
  casasReadingLevelStart: number;  // e.g., 207 for Level 3
  casasReadingTarget: number;       // e.g., 217 for Level 4
  casasListeningLevelStart: number; // e.g., 202 for Level 3
  casasListeningTarget: number;     // e.g., 212 for Level 4
  // Ranking Weights (percentages, should sum to 100)
  rankingWeights: RankingWeights;
  // Color Thresholds
  colorThresholds: ColorThresholds;
  /** Last successful "Student Gains" import for this class (YYYY-MM-DD) */
  casasGainsImportedAt: string | null;
  /** Saved ISST sub-groups (null/undefined until built). */
  isstGroups?: IsstGroups | null;
  createdAt: string;
  updatedAt: string;
}

export interface RankingWeights {
  casasReading: number;   // default 25
  casasListening: number; // default 25
  tests: number;          // default 25
  attendance: number;     // default 25
  speaking: number;
  writing: number;
}

export interface ColorThresholds {
  good: number;    // default 80 (80%+)
  warning: number; // default 60 (60-79%)
  // below warning = poor (red)
}

// Student
export interface Student {
  id: string;
  name: string;
  /** Given name(s) from attendance / roster (may include middle names). */
  firstName: string;
  /** Family name(s) from attendance / roster. */
  lastName: string;
  classId: string;
  enrollmentDate: string; // ISO date string
  notes: string;          // Personal notes (not for report cards)
  /** Student goal, written on the student hub. */
  goal?: string;
  isDropped: boolean;
  droppedDate: string | null;
  /** Left class successfully (e.g. promoted to next level) — excluded from active roster and retention */
  isPromoted: boolean;
  promotedDate: string | null;
  /** From CASAS Student Gains report import (per modality) */
  casasReadingGain: number | null;
  casasListeningGain: number | null;
  casasReadingLevelComplete: boolean;
  casasListeningLevelComplete: boolean;
  /** Shared focus/skill tags for ISST groups (ids from SkillTag). */
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

// CASAS Test (Reading or Listening)
export interface CASASTest {
  id: string;
  studentId: string;
  type: 'reading' | 'listening';
  date: string;        // ISO date string
  formNumber: string;  // e.g., "627L", "629R"
  score: number | null; // null if invalid (*)
  createdAt: string;
}

// Unit Test
export interface UnitTest {
  id: string;
  studentId: string;
  testName: string;    // e.g., "Unit 1", "Unit 2", "EL Civics"
  date: string;        // ISO date string
  score: number;       // 0-100
  createdAt: string;
}

export interface SpeakingTest {
  id: string;
  classId: string;
  title: string;
  exitAssessmentType?: 'none' | 'midterm' | 'final';
  date: string; // ISO date (YYYY-MM-DD)
  totalPoints: number;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpeakingTestResult {
  id: string;
  testId: string;
  studentId: string;
  score: number | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface WritingTest {
  id: string;
  classId: string;
  title: string;
  exitAssessmentType?: 'none' | 'midterm' | 'final';
  date: string; // ISO date (YYYY-MM-DD)
  totalPoints: number;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritingTestResult {
  id: string;
  testId: string;
  studentId: string;
  score: number | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Monthly Attendance
export interface Attendance {
  id: string;
  studentId: string;
  month: string;       // e.g., "2025-08" (YYYY-MM format)
  percentage: number;  // 0-100
  isVacation: boolean; // If true, excluded from average
  createdAt: string;
  /** Hours attended in the month, from the import file (null when entered by hand). */
  hoursAttended?: number | null;
  /** Report's "Class Scheduled Hrs in Date Range" for the month. */
  scheduledHours?: number | null;
  /** Per class day: hours the class met and hours this student attended. Lets the percentage be recalculated when the enrollment date changes. */
  dailyHours?: Record<string, AttendanceDayHours> | null;
}

export interface AttendanceDayHours {
  classHours: number;
  studentHours: number;
}

// Report Card
export interface ReportCard {
  id: string;
  studentId: string;
  periodName: string;  // e.g., "Fall 2025", "Fall 2025 #2"
  createdAt: string;
  updatedAt: string;
  // Snapshot of data at time of creation
  casasReadingAvg: number | null;
  casasReadingProgress: number | null;
  casasListeningAvg: number | null;
  casasListeningProgress: number | null;
  testAverage: number | null;
  attendanceAverage: number | null;
  rank: number | null;        // null if "Incomplete"
  totalStudents: number;
  // Teacher comments (new single field)
  teacherComments?: string;
  // Legacy fields (kept for backward compatibility with old saved report cards)
  speakingSkills?: string;
  writingSkills?: string;
  suggestionsForImprovement?: string;
}

// Archived Year
export interface ArchivedYear {
  id: string;
  yearName: string;    // e.g., "2024-2025"
  archivedAt: string;
  data: {
    classes: Class[];
    students: Student[];
    casasTests: CASASTest[];
    unitTests: UnitTest[];
    attendance: Attendance[];
    reportCards: ReportCard[];
    speakingTests?: SpeakingTest[];
    speakingTestResults?: SpeakingTestResult[];
    writingTests?: WritingTest[];
    writingTestResults?: WritingTestResult[];
    studentNotes?: StudentNote[];
    isstRecords?: ISSTRecord[];
  };
}

// ============================================
// Computed/Display Types
// ============================================

export interface StudentWithStats extends Student {
  casasReadingAvg: number | null;
  casasReadingLast: number | null;  // Most recent score
  casasReadingHighest: number | null;  // Highest score (used for progress)
  casasReadingProgress: number | null;
  casasListeningAvg: number | null;
  casasListeningLast: number | null;  // Most recent score
  casasListeningHighest: number | null;  // Highest score (used for progress)
  casasListeningProgress: number | null;
  testAverage: number | null;
  attendanceAverage: number | null;
  speakingAverage: number | null;
  writingAverage: number | null;
  overallScore: number | null;
  rank: number | null;
  isComplete: boolean; // Has all required data for ranking
}

export type SortDirection = 'asc' | 'desc';
export type SortField = 'name' | 'rank' | 'casasReading' | 'casasListening' | 'tests' | 'attendance';

// ============================================
// Retention Metrics Types
// ============================================

export interface RetentionResult {
  rate: number | null;      // null if not enough data
  retained: number;         // numerator
  eligible: number;         // denominator
}

export interface RetentionMetrics {
  thirtyDay: RetentionResult;
  midyear: RetentionResult;
  endYear: RetentionResult;
}

export interface ClassMetrics {
  studentCount: number;
  averageAttendance: number | null;
  retention: RetentionMetrics;
}

// ============================================
// Student Notes Types
// ============================================

export interface StudentNote {
  id: string;
  studentId: string;
  content: string;
  date: string;  // YYYY-MM-DD format
  createdAt: string;
}

// ============================================
// Skill / focus tags (shared across classes — ISST groups)
// ============================================

export interface SkillTag {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ISST (Tutoring) Types
// ============================================

export interface ISSTRecord {
  id: string;
  studentId: string;
  month: string;  // Format: YYYY-MM
  dates: string[];  // Array of dates in YYYY-MM-DD format
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Import Types
// ============================================

export interface CASASImportRow {
  studentName: string;
  date: string;
  formNumber: string;
  score: number | null;
}

export interface AttendanceImportRow {
  studentName: string;
  firstName?: string;
  lastName?: string;
  totalHours: number;
  scheduledHours: number;
  /** Optional status from file (e.g. "DROPPED") - used to auto-ignore dropped + zero hours */
  status?: string;
  /** When the file has per-day columns: first session date with any hours (YYYY-MM-DD) — for default enrollment */
  suggestedEnrollmentDate?: string;
  /** Raw "Class Scheduled Hrs in Date Range" from the file (before any mid-month adjustment). */
  reportScheduledHours?: number;
  /** Per-day class and student hours, keyed by YYYY-MM-DD (only when the file has per-day columns). */
  dailyHours?: Record<string, AttendanceDayHours>;
}

export interface UnitTestImportRow {
  studentName: string;
  score: number;
}
