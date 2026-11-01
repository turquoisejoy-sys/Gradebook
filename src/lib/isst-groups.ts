import { findOrCreateSkillTag, getClasses, updateClass } from './storage';
import { getStudentDisplayName } from './student-names';
import type { IsstGroups, IsstSkill, SkillTag, Student } from '@/types';

/** The three focus areas a student can be tagged with on their hub. */
export const FOCUS_AREAS = [
  { key: 'speaking', label: 'Speaking' },
  { key: 'writing', label: 'Writing' },
  { key: 'support', label: '1-1 Support' },
] as const;

export type FocusAreaKey = (typeof FOCUS_AREAS)[number]['key'];

export const ISST_SKILLS: { key: IsstSkill; label: string }[] = [
  { key: 'speaking', label: 'Speaking' },
  { key: 'writing', label: 'Writing' },
];

export const GROUP_SIZE_OPTIONS = [5, 6];
export const DEFAULT_GROUP_SIZE = 5;

/** Make sure the focus-area tags exist and return them by key. */
export function ensureFocusAreaTags(): Record<FocusAreaKey, SkillTag> {
  return Object.fromEntries(
    FOCUS_AREAS.map(area => [area.key, findOrCreateSkillTag(area.label)]),
  ) as Record<FocusAreaKey, SkillTag>;
}

/** Group letter: 0 → A, 1 → B, … */
export function groupLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

/** Split ids into as few groups as the size limit allows, with sizes as even as possible. */
export function splitIntoGroups(ids: string[], maxSize: number): string[][] {
  if (ids.length === 0) return [];
  const count = Math.ceil(ids.length / maxSize);
  const base = Math.floor(ids.length / count);
  const extra = ids.length % count;
  const groups: string[][] = [];
  let i = 0;
  for (let g = 0; g < count; g++) {
    const size = base + (g < extra ? 1 : 0);
    groups.push(ids.slice(i, i + size));
    i += size;
  }
  return groups;
}

/**
 * Saved groups checked against who is tagged now: drops students who were untagged
 * or left the class (and any group left empty), and lists tagged students not yet placed.
 */
export function resolveGroups(
  saved: string[][] | undefined,
  taggedIds: string[],
): { groups: string[][]; unplaced: string[] } {
  const tagged = new Set(taggedIds);
  const placed = new Set<string>();
  const groups: string[][] = [];
  for (const group of saved ?? []) {
    const kept = group.filter(id => tagged.has(id) && !placed.has(id));
    kept.forEach(id => placed.add(id));
    if (kept.length > 0) groups.push(kept);
  }
  return { groups, unplaced: taggedIds.filter(id => !placed.has(id)) };
}

/** Where a student can be moved: an existing group index, a new group, or back to unplaced. */
export type MoveTarget = number | 'new' | 'unplaced';

export function moveStudentInGroups(groups: string[][], studentId: string, target: MoveTarget): string[][] {
  const next = groups.map(g => g.filter(id => id !== studentId));
  if (target === 'new') next.push([studentId]);
  else if (typeof target === 'number' && next[target]) next[target].push(studentId);
  return next.filter(g => g.length > 0);
}

export function getIsstGroups(classId: string): IsstGroups {
  const saved = getClasses().find(c => c.id === classId)?.isstGroups;
  return {
    groupSize: saved?.groupSize ?? DEFAULT_GROUP_SIZE,
    speaking: saved?.speaking ?? null,
    writing: saved?.writing ?? null,
  };
}

export function saveIsstGroups(classId: string, groups: IsstGroups): void {
  updateClass(classId, { isstGroups: groups });
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Open a printable one-page list of the class's ISST groups. */
export function printIsstGroups(
  className: string,
  sections: { label: string; groups: string[][]; unplaced: string[] }[],
  supportStudents: Student[],
  studentsById: Map<string, Student>,
): void {
  const name = (id: string) => escapeHtml(studentsById.get(id) ? getStudentDisplayName(studentsById.get(id)!) : '');
  const list = (ids: string[]) => `<ul>${ids.map(id => `<li>${name(id)}</li>`).join('')}</ul>`;
  const skillHtml = sections
    .map(({ label, groups, unplaced }) => {
      if (groups.length === 0 && unplaced.length === 0) return '';
      const groupsHtml = groups
        .map((g, i) => `<div class="group"><h3>${escapeHtml(label)} ${groupLetter(i)}</h3>${list(g)}</div>`)
        .join('');
      const unplacedHtml =
        unplaced.length > 0
          ? `<div class="group unplaced"><h3>Needs a group</h3>${list(unplaced)}</div>`
          : '';
      const skillClass = `skill-${label.toLowerCase().replace(/[^a-z]/g, '')}`;
      return `<section class="${skillClass}"><h2>${escapeHtml(label)}</h2><div class="grid">${groupsHtml}${unplacedHtml}</div></section>`;
    })
    .join('');
  const supportHtml =
    supportStudents.length > 0
      ? `<section class="support"><h2>1-1 Support</h2>${list(supportStudents.map(s => s.id))}</section>`
      : '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>ISST groups — ${escapeHtml(className)}</title>
    <style>
      @page { margin: 0.4in; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; margin: 0; }
      h1 { font-size: 28px; margin: 0 0 2px; }
      .sub { color: #6b7280; font-size: 12px; margin: 0 0 8px; }
      h2 { font-size: 23px; margin: 8px 0 4px; border-bottom: 2px solid #d1d5db; padding-bottom: 2px; }
      h3 { font-size: 20px; margin: 0 0 4px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .group { border: 1px solid #9ca3af; border-radius: 6px; padding: 4px 8px; break-inside: avoid; }
      .unplaced { border-style: dashed; }
      ul { margin: 0; padding-left: 20px; font-size: 18px; line-height: 1.25; }
      li { margin: 1px 0; }
      .support ul { columns: 2; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .skill-speaking h2 { color: #c2410c; border-bottom-color: #f97316; }
      .skill-speaking .group { border: 2px solid #f97316; background: #fff7ed; }
      .skill-speaking h3 { color: #c2410c; }
      .skill-writing h2 { color: #15803d; border-bottom-color: #22c55e; }
      .skill-writing .group { border: 2px solid #22c55e; background: #f0fdf4; }
      .skill-writing h3 { color: #15803d; }
      .group.unplaced { border-style: dashed; }
    </style>
  </head>
  <body>
    <h1>ISST groups — ${escapeHtml(className)}</h1>
    <p class="sub">Printed ${escapeHtml(new Date().toLocaleDateString())}</p>
    ${skillHtml || '<p>No students tagged yet.</p>'}
    ${supportHtml}
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
