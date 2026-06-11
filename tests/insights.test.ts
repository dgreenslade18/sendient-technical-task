import { describe, expect, it } from "vitest";
import {
  cohortAverage,
  computeInsights,
  scoreDistribution,
  studentsNeedingAttention,
  subjectAverages,
  topicAverages,
  type InsightRecord,
} from "@/lib/insights";

function record(overrides: Partial<InsightRecord>): InsightRecord {
  return {
    studentId: 1,
    studentName: "Student 1",
    topicId: 1,
    topicName: "Fractions",
    topicSubject: "Maths",
    score: 50,
    ...overrides,
  };
}

/** Build n records for a student/topic pair with a fixed score. */
function records(
  count: number,
  overrides: Partial<InsightRecord>,
): InsightRecord[] {
  return Array.from({ length: count }, () => record(overrides));
}

describe("cohortAverage", () => {
  it("returns null when there are no records", () => {
    expect(cohortAverage([])).toBeNull();
  });

  it("weights each student equally, not each record", () => {
    // Student 1: prolific, average 90. Student 2: single record, score 30.
    // Record-weighted would be ~85; student-weighted is 60.
    const rows = [
      ...records(10, { studentId: 1, studentName: "A", score: 90 }),
      record({ studentId: 2, studentName: "B", score: 30 }),
    ];
    expect(cohortAverage(rows)).toBe(60);
  });
});

describe("topicAverages", () => {
  it("excludes topics below the minimum record count", () => {
    const rows = [
      ...records(5, { topicId: 1, topicName: "Algebra", score: 80 }),
      ...records(2, { topicId: 2, topicName: "Geometry", score: 95 }),
    ];
    const result = topicAverages(rows, 5);
    expect(result).toHaveLength(1);
    expect(result[0]?.topicName).toBe("Algebra");
  });

  it("sorts strongest topic first", () => {
    const rows = [
      ...records(5, { topicId: 1, topicName: "Algebra", score: 40 }),
      ...records(5, { topicId: 2, topicName: "Geometry", score: 80 }),
    ];
    const result = topicAverages(rows, 5);
    expect(result.map((t) => t.topicName)).toEqual(["Geometry", "Algebra"]);
  });
});

describe("subjectAverages", () => {
  it("averages records per subject, sorted alphabetically", () => {
    const rows = [
      record({ topicId: 1, topicSubject: "Science", score: 80 }),
      record({ topicId: 2, topicSubject: "Maths", score: 40 }),
      record({ topicId: 3, topicSubject: "Maths", score: 60 }),
    ];
    const result = subjectAverages(rows);
    expect(result).toEqual([
      { subject: "Maths", average: 50, recordCount: 2 },
      { subject: "Science", average: 80, recordCount: 1 },
    ]);
  });

  it("is empty for no records", () => {
    expect(subjectAverages([])).toEqual([]);
  });
});

describe("scoreDistribution", () => {
  it("buckets each student once by their average, respecting band boundaries", () => {
    const rows = [
      record({ studentId: 1, score: 49 }), // low
      record({ studentId: 2, score: 50 }), // mid
      record({ studentId: 3, score: 69 }), // mid
      record({ studentId: 4, score: 70 }), // high
    ];
    expect(scoreDistribution(rows)).toEqual({
      low: 1,
      mid: 2,
      high: 1,
      total: 4,
    });
  });

  it("is empty for no records", () => {
    expect(scoreDistribution([])).toEqual({
      low: 0,
      mid: 0,
      high: 0,
      total: 0,
    });
  });
});

describe("studentsNeedingAttention", () => {
  it("flags low-average students with enough records", () => {
    const rows = records(3, { studentId: 1, studentName: "Low", score: 30 });
    const result = studentsNeedingAttention(rows, 3);
    expect(result.map((s) => s.studentName)).toEqual(["Low"]);
  });

  it("does not flag a low average backed by too few records", () => {
    const rows = records(2, { studentId: 1, studentName: "Low", score: 30 });
    expect(studentsNeedingAttention(rows, 3)).toHaveLength(0);
  });

  it("does not flag students averaging 50 or above", () => {
    const rows = records(5, { studentId: 1, studentName: "Mid", score: 55 });
    expect(studentsNeedingAttention(rows, 3)).toHaveLength(0);
  });
});

describe("computeInsights", () => {
  it("handles an empty cohort without throwing", () => {
    const insights = computeInsights([]);
    expect(insights).toMatchObject({
      studentCount: 0,
      recordCount: 0,
      cohortAverage: null,
      strongestTopic: null,
      weakestTopic: null,
      studentsNeedingAttention: [],
    });
  });

  it("does not report the same topic as both strongest and weakest", () => {
    const rows = records(5, { topicId: 1, topicName: "Algebra", score: 80 });
    const insights = computeInsights(rows);
    expect(insights.strongestTopic?.topicName).toBe("Algebra");
    expect(insights.weakestTopic).toBeNull();
  });
});
