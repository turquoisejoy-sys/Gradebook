import { redirect } from 'next/navigation';

/** The roster now lives on the Attendance page (add, edit, leave class, print, import). */
export default async function StudentsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  redirect(`/classes/${classId}/attendance`);
}
