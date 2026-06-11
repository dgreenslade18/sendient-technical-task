"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
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

const recordProgressSchema = z.object({
  studentId: z.number().int().positive(),
  topicId: z.number().int().positive(),
  score: z.number().min(0).max(100),
  notes: z.string().trim().max(2000).nullish(),
});

export type RecordProgressInput = z.input<typeof recordProgressSchema>;

export async function recordProgress(input: unknown) {
  const data = recordProgressSchema.parse(input);
  const [row] = db
    .insert(progressRecords)
    .values({
      studentId: data.studentId,
      topicId: data.topicId,
      score: data.score,
      notes: data.notes ?? null,
    })
    .returning()
    .all();
  revalidatePath(`/students/${data.studentId}`);
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

export async function getAverageForStudent(
  studentId: number,
): Promise<number | null> {
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
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, r) => sum + r.score, 0);
  return total / rows.length;
}
