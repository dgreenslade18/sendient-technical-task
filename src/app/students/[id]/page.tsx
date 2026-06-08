import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ScoreBadge";
import { AverageScoreWidget } from "@/components/AverageScoreWidget";
import {
  getProgressForStudent,
  getStudent,
} from "@/lib/actions/server.actions";

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isFinite(studentId)) notFound();

  const student = await getStudent(studentId);
  if (!student) notFound();

  const progress = await getProgressForStudent(studentId);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{student.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Year {student.yearGroup} · {progress.length} records
          </p>
        </div>
        <Link
          href="/students"
          className="text-sm text-blue-600 hover:underline"
        >
          ← All students
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Suspense
          fallback={
            <Card>
              <CardTitle>Average score</CardTitle>
              <CardSubtitle>Loading…</CardSubtitle>
            </Card>
          }
        >
          <AverageScoreWidget studentId={studentId} />
        </Suspense>
        <Card>
          <CardTitle>Records</CardTitle>
          <p className="mt-2 text-3xl font-semibold">{progress.length}</p>
        </Card>
        <Card>
          <CardTitle>Topics covered</CardTitle>
          <p className="mt-2 text-3xl font-semibold">
            {new Set(progress.map((p) => p.topicId)).size}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>Progress log</CardTitle>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Topic</th>
              <th className="py-1 font-medium">Subject</th>
              <th className="py-1 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-2 text-muted-foreground">
                  {new Date(p.recordedAt).toLocaleDateString()}
                </td>
                <td className="py-2">{p.topicName}</td>
                <td className="py-2 text-muted-foreground">{p.topicSubject}</td>
                <td className="py-2">
                  <ScoreBadge score={p.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {progress.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No progress recorded yet.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
