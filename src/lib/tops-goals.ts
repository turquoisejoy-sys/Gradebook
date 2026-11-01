import { sortStudentsByLastName } from './calculations';
import { getStudentDisplayName } from './student-names';
import type { Student } from '@/types';

/** Official TOPS goals a student can be given (as listed in TOPS). */
export const TOPS_GOALS = [
  'H.S. Diploma/HSE',
  'Get a job',
  'Retain a job',
  'Enter college or training',
  'Work-based project',
  'Family goal',
  'U.S. Citizenship',
  'Military',
  'Personal goal',
  'Other',
  'Get a better job',
  'Enter short-term training',
] as const;

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Open a printable list of every student's TOPS goal for one class. */
export function printTopsGoals(className: string, students: Student[]): void {
  const sorted = sortStudentsByLastName(students);
  const missing = sorted.filter(s => !s.topsGoal?.trim()).length;
  const rows = sorted
    .map((s, i) => {
      const goal = s.topsGoal?.trim();
      return `<tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(getStudentDisplayName(s))}</td>
        <td>${goal ? escapeHtml(goal) : '<span class="missing">Not selected</span>'}</td>
      </tr>`;
    })
    .join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>TOPS goals — ${escapeHtml(className)}</title>
    <style>
      @page { margin: 0.5in; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; margin: 0; }
      h1 { font-size: 20px; margin: 0 0 2px; }
      .sub { color: #6b7280; font-size: 12px; margin: 0 0 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
      th { border-bottom: 2px solid #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: #4b5563; }
      tr { break-inside: avoid; }
      .num { width: 2em; color: #9ca3af; }
      .missing { color: #b91c1c; font-style: italic; }
    </style>
  </head>
  <body>
    <h1>TOPS goals — ${escapeHtml(className)}</h1>
    <p class="sub">Printed ${escapeHtml(new Date().toLocaleDateString())} · ${sorted.length} students${
      missing > 0 ? ` · ${missing} without a TOPS goal` : ''
    }</p>
    ${
      sorted.length > 0
        ? `<table><thead><tr><th></th><th>Student</th><th>TOPS goal</th></tr></thead><tbody>${rows}</tbody></table>`
        : '<p>No students in this class.</p>'
    }
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
