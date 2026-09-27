/**
 * Print helpers for per-student hub records (folder packets).
 * Each student is a self-contained section; bulk print forces a page break between students.
 */

import { getStudentsByClass, getClasses, getSkillTags } from '@/lib/storage';
import { sortStudentsByLastName } from '@/lib/calculations';
import {
  getStudentHubData,
  type AssessmentDetailRow,
  type StudentHubData,
} from '@/lib/student-hub';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${n.toFixed(0)}%`;
}

function formatScore(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return String(n);
}

function listOrNone(items: string[]): string {
  if (items.length === 0) return '<p class="muted">None</p>';
  return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}

function assessmentSectionHtml(title: string, average: number | null, rows: AssessmentDetailRow[]): string {
  const avg =
    average !== null
      ? `<span class="badge">Avg: ${escapeHtml(formatPct(average))}</span>`
      : '';
  if (rows.length === 0) {
    return `
      <section class="block">
        <div class="block-head"><h2>${escapeHtml(title)}</h2>${avg}</div>
        <p class="muted">No ${escapeHtml(title.toLowerCase())} tests recorded</p>
      </section>`;
  }
  const rowsHtml = rows
    .map(row => {
      const comment = row.comment
        ? `<p class="comment">${escapeHtml(row.comment)}</p>`
        : `<p class="muted italic">No comment</p>`;
      return `
        <div class="assessment-row">
          <div class="assessment-meta">
            <strong>${escapeHtml(row.testName)}</strong>
            <span class="muted">${escapeHtml(row.date)}</span>
            <span class="badge">${escapeHtml(`${row.score}/${row.totalPoints}`)} (${escapeHtml(formatPct(row.percent))})</span>
          </div>
          ${comment}
        </div>`;
    })
    .join('');
  return `
    <section class="block">
      <div class="block-head"><h2>${escapeHtml(title)}</h2>${avg}</div>
      ${rowsHtml}
    </section>`;
}

/** HTML for one student hub packet (no document wrapper). */
export function buildStudentHubRecordInnerHtml(data: StudentHubData): string {
  const { classData, student, totalStudents, notes, personalNotes } = data;
  const rankLine =
    student.rank != null
      ? `Rank #${student.rank} of ${totalStudents}`
      : 'Incomplete for ranking';

  const readingList = [...data.readingTests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      t =>
        `${escapeHtml(t.date)}: ${escapeHtml(formatScore(t.score))} (${escapeHtml(t.formNumber)})`,
    );
  const listeningList = [...data.listeningTests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      t =>
        `${escapeHtml(t.date)}: ${escapeHtml(formatScore(t.score))} (${escapeHtml(t.formNumber)})`,
    );
  const unitList = [...data.unitTests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      t =>
        `${escapeHtml(t.testName)} (${escapeHtml(t.date)}): ${escapeHtml(String(t.score))}%`,
    );
  const attendanceList = [...data.attendance]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(
      a =>
        `${escapeHtml(a.month)}: ${escapeHtml(a.percentage.toFixed(0))}%${
          a.isVacation ? ' (vacation)' : ''
        }`,
    );

  const personalBlock = personalNotes
    ? `<div class="note-box"><p class="label">Roster / personal note</p><p class="pre">${escapeHtml(personalNotes)}</p></div>`
    : '';

  const notesSorted = [...notes].sort((a, b) => a.date.localeCompare(b.date));
  const notesHtml =
    notesSorted.length === 0
      ? '<p class="muted">No dated notes</p>'
      : notesSorted
          .map(
            n => `
        <div class="note-box">
          <p class="label">${escapeHtml(n.date)}</p>
          <p class="pre">${escapeHtml(n.content)}</p>
        </div>`,
          )
          .join('');

  const tagById = new Map(getSkillTags().map(t => [t.id, t]));
  const tagLabels = (student.tagIds || [])
    .map(id => tagById.get(id)?.label)
    .filter((l): l is string => !!l);
  const tagsHtml =
    tagLabels.length === 0
      ? '<p class="muted">No focus tags</p>'
      : `<p>${tagLabels.map(l => `<span class="badge" style="margin-right:6px">${escapeHtml(l)}</span>`).join('')}</p>`;

  return `
    <header class="student-header">
      <h1>${escapeHtml(student.name)}</h1>
      <p class="subtitle">
        ${escapeHtml(classData.name)} · ${escapeHtml(classData.schedule)} · ${escapeHtml(classData.academicYear)}
      </p>
      <p class="subtitle">${escapeHtml(rankLine)} · Enrolled ${escapeHtml(
        new Date(student.enrollmentDate + 'T00:00:00').toLocaleDateString(),
      )}</p>
    </header>

    <section class="block">
      <h2>Focus tags</h2>
      ${tagsHtml}
    </section>

    <section class="block">
      <h2>Overview</h2>
      <table class="stats">
        <tr>
          <td>CASAS Reading progress</td><td>${escapeHtml(formatPct(student.casasReadingProgress))}</td>
          <td>CASAS Listening progress</td><td>${escapeHtml(formatPct(student.casasListeningProgress))}</td>
        </tr>
        <tr>
          <td>Unit tests avg</td><td>${escapeHtml(formatPct(student.testAverage))}</td>
          <td>Attendance avg</td><td>${escapeHtml(formatPct(student.attendanceAverage))}</td>
        </tr>
        <tr>
          <td>Speaking avg</td><td>${escapeHtml(formatPct(student.speakingAverage))}</td>
          <td>Writing avg</td><td>${escapeHtml(formatPct(student.writingAverage))}</td>
        </tr>
      </table>
      <div class="two-col">
        <div>
          <h3>CASAS Reading scores</h3>
          ${listOrNone(readingList)}
        </div>
        <div>
          <h3>CASAS Listening scores</h3>
          ${listOrNone(listeningList)}
        </div>
        <div>
          <h3>Unit tests</h3>
          ${listOrNone(unitList)}
        </div>
        <div>
          <h3>Attendance</h3>
          ${listOrNone(attendanceList)}
        </div>
      </div>
    </section>

    ${assessmentSectionHtml('Speaking', student.speakingAverage, data.speakingRows)}
    ${assessmentSectionHtml('Writing', student.writingAverage, data.writingRows)}

    <section class="block">
      <h2>Teacher notes</h2>
      ${personalBlock}
      ${notesHtml}
    </section>
  `;
}

const PRINT_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1f2937;
    margin: 0;
    padding: 24px;
    font-size: 12px;
    line-height: 1.45;
  }
  .student-record {
    max-width: 800px;
    margin: 0 auto;
  }
  .student-record + .student-record {
    margin-top: 32px;
  }
  .student-header h1 {
    color: #1e3a5f;
    font-size: 22px;
    margin: 0 0 4px 0;
  }
  .subtitle {
    color: #6b7280;
    margin: 0 0 4px 0;
    font-size: 12px;
  }
  .block {
    margin-top: 18px;
    page-break-inside: avoid;
  }
  .block h2 {
    color: #1e3a5f;
    font-size: 15px;
    margin: 0 0 8px 0;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
  }
  .block h3 {
    font-size: 12px;
    margin: 8px 0 4px 0;
    color: #374151;
  }
  .block-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .stats {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }
  .stats td {
    padding: 3px 8px 3px 0;
    vertical-align: top;
  }
  .stats td:nth-child(odd) {
    color: #6b7280;
    width: 28%;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  ul {
    margin: 0;
    padding-left: 18px;
  }
  .muted { color: #9ca3af; margin: 0; }
  .italic { font-style: italic; }
  .badge {
    display: inline-block;
    background: #f3f4f6;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 11px;
  }
  .assessment-row {
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f3f4f6;
  }
  .assessment-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: baseline;
  }
  .comment, .pre {
    margin: 4px 0 0 0;
    white-space: pre-wrap;
  }
  .note-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 8px;
  }
  .label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    margin: 0 0 4px 0;
  }
  @media print {
    body { padding: 12px; }
    .student-record {
      break-after: page;
      page-break-after: always;
    }
    .student-record:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
`;

function openPrintWindow(title: string, bodyHtml: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

/** Print one student's full hub record (for that student's file). */
export function printStudentHubRecord(classId: string, studentId: string): void {
  const data = getStudentHubData(classId, studentId);
  if (!data) return;
  const inner = `<div class="student-record">${buildStudentHubRecordInnerHtml(data)}</div>`;
  openPrintWindow(`Student record — ${data.student.name}`, inner);
}

/**
 * Print every active student's hub record in one job.
 * Each student starts on a new page so packets can be filed separately.
 */
export function printAllStudentHubRecords(classId: string): void {
  const classData = getClasses().find(c => c.id === classId);
  const students = sortStudentsByLastName(getStudentsByClass(classId));
  const sections = students
    .map(s => {
      const data = getStudentHubData(classId, s.id);
      if (!data) return '';
      return `<div class="student-record">${buildStudentHubRecordInnerHtml(data)}</div>`;
    })
    .filter(Boolean)
    .join('\n');

  if (!sections) return;

  openPrintWindow(`Student records — ${classData?.name || 'Class'}`, sections);
}
