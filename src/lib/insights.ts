import { classifyScore, type ScoreBand } from "@/lib/scoring";

/**
 * A single active progress record, flattened with its student and topic.
 * The DB layer is responsible for filtering out soft-deleted rows; everything
 * in this module is pure and side-effect free so it can be unit tested.
 */
export interface InsightRecord {
  readonly studentId: number;
  readonly studentName: string;
  readonly topicId: number;
  readonly topicName: string;
  readonly topicSubject: string;
  readonly score: number;
}

export interface StudentStat {
  readonly studentId: number;
  readonly studentName: string;
  readonly average: number;
  readonly recordCount: number;
}

export interface TopicStat {
  readonly topicId: number;
  readonly topicName: string;
  readonly topicSubject: string;
  readonly average: number;
  readonly recordCount: number;
}

export interface ScoreDistribution {
  readonly low: number;
  readonly mid: number;
  readonly high: number;
  readonly total: number;
}

export interface CohortInsights {
  readonly studentCount: number;
  readonly recordCount: number;
  readonly cohortAverage: number | null;
  readonly distribution: ScoreDistribution;
  readonly strongestTopic: TopicStat | null;
  readonly weakestTopic: TopicStat | null;
  readonly studentsNeedingAttention: StudentStat[];
}

// Minimum records before a figure is trustworthy enough to surface. Below
// this we hold a topic back from strongest/weakest, and hold back the "needs
// attention" flag, so a single stray score cannot mislead the teacher.
export const MIN_TOPIC_RECORDS = 5;
export const MIN_STUDENT_RECORDS = 3;

function mean(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

/** Average score per student, each student appearing once. */
export function studentAverages(
  records: readonly InsightRecord[],
): StudentStat[] {
  const byStudent = new Map<number, { name: string; scores: number[] }>();
  for (const record of records) {
    const entry = byStudent.get(record.studentId) ?? {
      name: record.studentName,
      scores: [],
    };
    entry.scores.push(record.score);
    byStudent.set(record.studentId, entry);
  }
  return [...byStudent.entries()].map(([studentId, { name, scores }]) => ({
    studentId,
    studentName: name,
    average: mean(scores),
    recordCount: scores.length,
  }));
}

/**
 * Cohort average as the mean of each student's average, so a heavily-assessed
 * student does not dominate the headline figure. Returns null when no student
 * has any records.
 */
export function cohortAverage(records: readonly InsightRecord[]): number | null {
  const averages = studentAverages(records);
  if (averages.length === 0) return null;
  return mean(averages.map((student) => student.average));
}

/**
 * Average score per topic, sorted strongest first. Topics with fewer than
 * minRecords are excluded so thin samples do not appear as the strongest or
 * weakest area. Ties break alphabetically for a stable order.
 */
export function topicAverages(
  records: readonly InsightRecord[],
  minRecords: number = MIN_TOPIC_RECORDS,
): TopicStat[] {
  const byTopic = new Map<
    number,
    { name: string; subject: string; scores: number[] }
  >();
  for (const record of records) {
    const entry = byTopic.get(record.topicId) ?? {
      name: record.topicName,
      subject: record.topicSubject,
      scores: [],
    };
    entry.scores.push(record.score);
    byTopic.set(record.topicId, entry);
  }
  return [...byTopic.entries()]
    .map(([topicId, { name, subject, scores }]) => ({
      topicId,
      topicName: name,
      topicSubject: subject,
      average: mean(scores),
      recordCount: scores.length,
    }))
    .filter((topic) => topic.recordCount >= minRecords)
    .sort(
      (a, b) => b.average - a.average || a.topicName.localeCompare(b.topicName),
    );
}

/** Distribution of students across the score bands, each student counted once. */
export function scoreDistribution(
  records: readonly InsightRecord[],
): ScoreDistribution {
  const counts: Record<ScoreBand, number> = { low: 0, mid: 0, high: 0 };
  const averages = studentAverages(records);
  for (const student of averages) {
    counts[classifyScore(student.average)] += 1;
  }
  return { ...counts, total: averages.length };
}

/**
 * Students whose own average sits in the low band, with enough records to be
 * confident it is not a one-off. Sorted lowest average first.
 */
export function studentsNeedingAttention(
  records: readonly InsightRecord[],
  minRecords: number = MIN_STUDENT_RECORDS,
): StudentStat[] {
  return studentAverages(records)
    .filter(
      (student) =>
        student.recordCount >= minRecords &&
        classifyScore(student.average) === "low",
    )
    .sort(
      (a, b) => a.average - b.average || a.studentName.localeCompare(b.studentName),
    );
}

export function computeInsights(
  records: readonly InsightRecord[],
): CohortInsights {
  const rankedTopics = topicAverages(records);
  return {
    studentCount: new Set(records.map((record) => record.studentId)).size,
    recordCount: records.length,
    cohortAverage: cohortAverage(records),
    distribution: scoreDistribution(records),
    strongestTopic: rankedTopics[0] ?? null,
    // Only report a distinct weakest topic when at least two topics qualify,
    // otherwise the same topic would be both strongest and weakest.
    weakestTopic:
      rankedTopics.length >= 2 ? rankedTopics[rankedTopics.length - 1] : null,
    studentsNeedingAttention: studentsNeedingAttention(records),
  };
}
