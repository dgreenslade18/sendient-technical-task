"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { progressRecords, students, topics } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function getStudents() {
  return db
    .select()
    .from(students)
    .where(isNull(students.deletedAt))
    .orderBy(students.name)
    .all();
}

export async function getStudent(id: number) {
  const row = db
    .select()
    .from(students)
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .get();
  return row ?? null;
}

export async function createStudent(input: { name: string; yearGroup: number }) {
  const [row] = db
    .insert(students)
    .values({ name: input.name, yearGroup: input.yearGroup })
    .returning()
    .all();
  revalidatePath("/students");
  return row;
}

export async function deleteStudent(id: number) {
  // Soft delete: preserve the student's progress history for audit value.
  db.update(students)
    .set({ deletedAt: new Date() })
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .run();
  revalidatePath("/students");
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export async function getTopics() {
  return db
    .select()
    .from(topics)
    .where(isNull(topics.deletedAt))
    .orderBy(topics.subject, topics.name)
    .all();
}

export async function createTopic(input: { name: string; subject: string }) {
  const [row] = db.insert(topics).values(input).returning().all();
  revalidatePath("/topics");
  return row;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

// FIXME(PROG-42): scores outside 0..100 are accepted by this action.
// A teacher logged a "120" once and it broke the student detail page badges.
// We have not yet added validation here or a regression test guarding the range.
export async function recordProgress(input: any) {
  const [row] = db
    .insert(progressRecords)
    .values({
      studentId: input.studentId,
      topicId: input.topicId,
      score: input.score,
      notes: input.notes ?? null,
    })
    .returning()
    .all();
  revalidatePath(`/students/${input.studentId}`);
  return row;
}

export async function getProgressForStudent(studentId: number) {
  return db
    .select({
      id: progressRecords.id,
      score: progressRecords.score,
      notes: progressRecords.notes,
      recordedAt: progressRecords.recordedAt,
      topicId: progressRecords.topicId,
      topicName: topics.name,
      topicSubject: topics.subject,
    })
    .from(progressRecords)
    .innerJoin(topics, eq(progressRecords.topicId, topics.id))
    .where(
      and(
        eq(progressRecords.studentId, studentId),
        isNull(progressRecords.deletedAt),
        isNull(topics.deletedAt),
      ),
    )
    .orderBy(desc(progressRecords.recordedAt))
    .all();
}

export async function getAverageForStudent(studentId: number): Promise<number> {
  const rows = db
    .select({ score: progressRecords.score })
    .from(progressRecords)
    .where(
      and(
        eq(progressRecords.studentId, studentId),
        isNull(progressRecords.deletedAt),
      ),
    )
    .all();
  const total = rows.reduce((sum, r) => sum + r.score, 0);
  return total / rows.length;
}
