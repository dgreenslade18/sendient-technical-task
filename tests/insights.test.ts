import { describe, expect, it } from "vitest";
import {
  cohortAverage,
  computeCoverage,
  computeInsights,
  scoreDistribution,
  studentsNeedingAttention,
  subjectAverages,
  topicAverages,
  type InsightRecord,
} from "@/lib/insights";

function makeRecord(overrides: Partial<InsightRecord>): InsightRecord {
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

function makeRecords(
  count: number,
  overrides: Partial<InsightRecord>,
): InsightRecord[] {
  return Array.from({ length: count }, () => makeRecord(overrides));
}

describe("cohortAverage", () => {
  it("returns null when there are no records", () => {
    expect(cohortAverage([])).toBeNull();
  });

  it("weights each student equally, not each record", () => {
    const rows = [
      ...makeRecords(10, { studentId: 1, studentName: "A", score: 90 }),
      ...makeRecords(3, { studentId: 2, studentName: "B", score: 30 }),
    ];
    expect(cohortAverage(rows)).toBe(60);
  });

  it("excludes students below the eligibility threshold", () => {
    const rows = [
      ...makeRecords(3, { studentId: 1, studentName: "Eligible", score: 80 }),
      makeRecord({ studentId: 2, studentName: "OneOff", score: 20 }),
    ];
    expect(cohortAverage(rows, 3)).toBe(80);
  });
});

describe("topicAverages", () => {
  it("excludes topics below the minimum record count", () => {
    const rows = [
      ...makeRecords(5, { topicId: 1, topicName: "Algebra", score: 80 }),
      ...makeRecords(2, { topicId: 2, topicName: "Geometry", score: 95 }),
    ];
    const result = topicAverages(rows, 5);
    expect(result).toHaveLength(1);
    expect(result[0]?.topicName).toBe("Algebra");
  });

  it("sorts strongest topic first", () => {
    const rows = [
      ...makeRecords(5, { topicId: 1, topicName: "Algebra", score: 40 }),
      ...makeRecords(5, { topicId: 2, topicName: "Geometry", score: 80 }),
    ];
    const result = topicAverages(rows, 5);
    expect(result.map((t) => t.topicName)).toEqual(["Geometry", "Algebra"]);
  });
});

describe("subjectAverages", () => {
  it("averages records per subject, sorted alphabetically", () => {
    const rows = [
      makeRecord({ topicId: 1, topicSubject: "Science", score: 80 }),
      makeRecord({ topicId: 2, topicSubject: "Maths", score: 40 }),
      makeRecord({ topicId: 3, topicSubject: "Maths", score: 60 }),
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
  it("buckets each eligible student once, respecting band boundaries", () => {
    const rows = [
      ...makeRecords(3, { studentId: 1, score: 49 }),
      ...makeRecords(3, { studentId: 2, score: 50 }),
      ...makeRecords(3, { studentId: 3, score: 69 }),
      ...makeRecords(3, { studentId: 4, score: 70 }),
    ];
    expect(scoreDistribution(rows)).toEqual({
      low: 1,
      mid: 2,
      high: 1,
      total: 4,
    });
  });

  it("excludes ineligible students so it reconciles with the attention list", () => {
    const rows = [
      ...makeRecords(3, { studentId: 1, studentName: "Eligible", score: 30 }),
      makeRecord({ studentId: 2, studentName: "OneOff", score: 30 }),
    ];
    expect(scoreDistribution(rows, 3)).toEqual({
      low: 1,
      mid: 0,
      high: 0,
      total: 1,
    });
    expect(studentsNeedingAttention(rows, 3)).toHaveLength(1);
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
    const rows = makeRecords(3, { studentId: 1, studentName: "Low", score: 30 });
    const result = studentsNeedingAttention(rows, 3);
    expect(result.map((s) => s.studentName)).toEqual(["Low"]);
  });

  it("does not flag a low average backed by too few records", () => {
    const rows = makeRecords(2, { studentId: 1, studentName: "Low", score: 30 });
    expect(studentsNeedingAttention(rows, 3)).toHaveLength(0);
  });

  it("does not flag students averaging 50 or above", () => {
    const rows = makeRecords(5, { studentId: 1, studentName: "Mid", score: 55 });
    expect(studentsNeedingAttention(rows, 3)).toHaveLength(0);
  });
});

describe("computeCoverage", () => {
  it("surfaces never-assessed and insufficiently-assessed students separately", () => {
    const roster = [
      { id: 1, name: "Scored" },
      { id: 2, name: "Thin" },
      { id: 3, name: "Unassessed" },
    ];
    const rows = [
      ...makeRecords(3, { studentId: 1, studentName: "Scored", score: 80 }),
      makeRecord({ studentId: 2, studentName: "Thin", score: 40 }),
    ];
    const coverage = computeCoverage(rows, roster, 3);
    expect(coverage).toEqual({
      totalStudents: 3,
      assessedStudents: 2,
      eligibleStudents: 1,
      insufficientStudents: [
        { studentId: 2, studentName: "Thin", recordCount: 1 },
      ],
      noRecordStudents: [
        { studentId: 3, studentName: "Unassessed", recordCount: 0 },
      ],
    });
  });

  it("reports full coverage when every student is eligible", () => {
    const roster = [{ id: 1, name: "A" }];
    const rows = makeRecords(3, { studentId: 1, studentName: "A", score: 80 });
    const coverage = computeCoverage(rows, roster, 3);
    expect(coverage.eligibleStudents).toBe(1);
    expect(coverage.noRecordStudents).toEqual([]);
    expect(coverage.insufficientStudents).toEqual([]);
  });
});

describe("computeInsights", () => {
  it("handles an empty cohort without throwing", () => {
    const insights = computeInsights([], []);
    expect(insights).toMatchObject({
      studentCount: 0,
      recordCount: 0,
      cohortAverage: null,
      strongestTopic: null,
      weakestTopic: null,
      studentsNeedingAttention: [],
      coverage: {
        totalStudents: 0,
        assessedStudents: 0,
        eligibleStudents: 0,
        noRecordStudents: [],
        insufficientStudents: [],
      },
    });
  });

  it("does not report the same topic as both strongest and weakest", () => {
    const rows = makeRecords(5, { topicId: 1, topicName: "Algebra", score: 80 });
    const insights = computeInsights(rows, [{ id: 1, name: "Student 1" }]);
    expect(insights.strongestTopic?.topicName).toBe("Algebra");
    expect(insights.weakestTopic).toBeNull();
  });
});
