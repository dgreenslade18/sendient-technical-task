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

export interface SubjectStat {
  readonly subject: string;
  readonly average: number;
  readonly recordCount: number;
}

/** A student on the active roster, used to surface those without enough data. */
export interface StudentRef {
  readonly id: number;
  readonly name: string;
}

export interface UnassessedStudent {
  readonly studentId: number;
  readonly studentName: string;
  readonly recordCount: number;
}

/**
 * How much of the cohort the scored figures actually cover. Students without
 * enough records are reported here rather than silently dropped.
 */
export interface Coverage {
  readonly totalStudents: number;
  readonly assessedStudents: number;
  readonly eligibleStudents: number;
  readonly noRecordStudents: UnassessedStudent[];
  readonly insufficientStudents: UnassessedStudent[];
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
  readonly subjectAverages: SubjectStat[];
  readonly studentsNeedingAttention: StudentStat[];
  readonly coverage: Coverage;
}

// Minimum records before a figure is trustworthy enough to surface. Below
// this we hold a topic back from strongest/weakest, and exclude a student from
// the scored figures (average, distribution, attention) so a single stray
// score cannot mislead the teacher. Excluded students are reported in coverage
// rather than silently dropped.
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
 * Students with enough records to be included in the scored figures. This is
 * the single eligibility rule shared by the cohort average, the distribution
 * and the attention list, so those figures never disagree about who counts.
 */
export function eligibleStudents(
  records: readonly InsightRecord[],
  minRecords: number = MIN_STUDENT_RECORDS,
): StudentStat[] {
  return studentAverages(records).filter(
    (student) => student.recordCount >= minRecords,
  );
}

/**
 * Cohort average as the mean of each eligible student's average, so a
 * heavily-assessed student does not dominate the headline figure. Returns null
 * when no student has enough records.
 */
export function cohortAverage(
  records: readonly InsightRecord[],
  minRecords: number = MIN_STUDENT_RECORDS,
): number | null {
  const eligible = eligibleStudents(records, minRecords);
  if (eligible.length === 0) return null;
  return mean(eligible.map((student) => student.average));
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

/**
 * Average score per subject across all records in that subject, sorted
 * alphabetically for a stable order.
 */
export function subjectAverages(
  records: readonly InsightRecord[],
): SubjectStat[] {
  const bySubject = new Map<string, number[]>();
  for (const record of records) {
    const scores = bySubject.get(record.topicSubject) ?? [];
    scores.push(record.score);
    bySubject.set(record.topicSubject, scores);
  }
  return [...bySubject.entries()]
    .map(([subject, scores]) => ({
      subject,
      average: mean(scores),
      recordCount: scores.length,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

/**
 * Distribution of eligible students across the score bands, each student
 * counted once. Uses the shared eligibility rule so the totals reconcile with
 * the attention list.
 */
export function scoreDistribution(
  records: readonly InsightRecord[],
  minRecords: number = MIN_STUDENT_RECORDS,
): ScoreDistribution {
  const counts: Record<ScoreBand, number> = { low: 0, mid: 0, high: 0 };
  const eligible = eligibleStudents(records, minRecords);
  for (const student of eligible) {
    counts[classifyScore(student.average)] += 1;
  }
  return { ...counts, total: eligible.length };
}

/**
 * Eligible students whose own average sits in the low band. Sorted lowest
 * average first.
 */
export function studentsNeedingAttention(
  records: readonly InsightRecord[],
  minRecords: number = MIN_STUDENT_RECORDS,
): StudentStat[] {
  return eligibleStudents(records, minRecords)
    .filter((student) => classifyScore(student.average) === "low")
    .sort(
      (a, b) => a.average - b.average || a.studentName.localeCompare(b.studentName),
    );
}

/**
 * How much of the roster the scored figures cover. Students with no records,
 * and students with too few records to score, are listed separately so the
 * teacher can see exactly who is excluded and why.
 */
export function computeCoverage(
  records: readonly InsightRecord[],
  roster: readonly StudentRef[],
  minRecords: number = MIN_STUDENT_RECORDS,
): Coverage {
  const statById = new Map(
    studentAverages(records).map((student) => [student.studentId, student]),
  );
  const noRecordStudents: UnassessedStudent[] = [];
  const insufficientStudents: UnassessedStudent[] = [];
  let eligibleCount = 0;

  for (const student of roster) {
    const recordCount = statById.get(student.id)?.recordCount ?? 0;
    if (recordCount === 0) {
      noRecordStudents.push({
        studentId: student.id,
        studentName: student.name,
        recordCount: 0,
      });
    } else if (recordCount < minRecords) {
      insufficientStudents.push({
        studentId: student.id,
        studentName: student.name,
        recordCount,
      });
    } else {
      eligibleCount += 1;
    }
  }

  const byName = (a: UnassessedStudent, b: UnassessedStudent) =>
    a.studentName.localeCompare(b.studentName);
  noRecordStudents.sort(byName);
  insufficientStudents.sort(byName);

  return {
    totalStudents: roster.length,
    assessedStudents: statById.size,
    eligibleStudents: eligibleCount,
    noRecordStudents,
    insufficientStudents,
  };
}

export function computeInsights(
  records: readonly InsightRecord[],
  roster: readonly StudentRef[] = [],
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
    subjectAverages: subjectAverages(records),
    studentsNeedingAttention: studentsNeedingAttention(records),
    coverage: computeCoverage(records, roster),
  };
}
