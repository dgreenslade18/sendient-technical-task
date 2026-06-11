"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { progressRecords, students, topics } from "@/lib/db/schema";
import type { InsightRecord } from "@/lib/insights";

/**
 * Active progress records joined to their student and topic. Soft-deleted
 * records, students and topics are all excluded so deleted entities cannot
 * skew any cohort figure.
 */
export async function getInsightRecords(): Promise<InsightRecord[]> {
  return db
    .select({
      studentId: students.id,
      studentName: students.name,
      topicId: topics.id,
      topicName: topics.name,
      topicSubject: topics.subject,
      score: progressRecords.score,
    })
    .from(progressRecords)
    .innerJoin(students, eq(progressRecords.studentId, students.id))
    .innerJoin(topics, eq(progressRecords.topicId, topics.id))
    .where(
      and(
        isNull(progressRecords.deletedAt),
        isNull(students.deletedAt),
        isNull(topics.deletedAt),
      ),
    )
    .all();
}
