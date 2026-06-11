import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getInsightRecords } from "@/lib/actions/insights.actions";
import {
  computeInsights,
  type ScoreDistribution,
  type StudentStat,
  type SubjectStat,
  type TopicStat,
} from "@/lib/insights";

export default async function InsightsPage() {
  const records = await getInsightRecords();
  const insights = computeInsights(records);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cohort insights</h1>
        <p className="mt-1 text-muted-foreground">
          {insights.recordCount} records across {insights.studentCount}{" "}
          students.
        </p>
      </div>

      {insights.recordCount === 0 ? (
        <Card>
          <CardTitle>Not enough data yet</CardTitle>
          <CardSubtitle>
            There are no progress records to summarise.
          </CardSubtitle>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CohortAverageCard average={insights.cohortAverage} />
            <TopicCard
              title="Highest scoring topic"
              topic={insights.strongestTopic}
            />
            <TopicCard title="Lowest scoring topic" topic={insights.weakestTopic} />
          </div>

          <SubjectSummaryCard subjects={insights.subjectAverages} />

          <DistributionCard distribution={insights.distribution} />

          <AttentionCard students={insights.studentsNeedingAttention} />
        </>
      )}
    </div>
  );
}

function CohortAverageCard({ average }: { readonly average: number | null }) {
  return (
    <Card>
      <CardTitle>Cohort average</CardTitle>
      {average === null ? (
        <CardSubtitle className="mt-2">Not enough data yet.</CardSubtitle>
      ) : (
        <>
          <p className="mt-2 text-3xl font-semibold">{average.toFixed(0)}</p>
          <CardSubtitle className="mt-1">
            Average score across all students.
          </CardSubtitle>
        </>
      )}
    </Card>
  );
}

function TopicCard({
  title,
  topic,
}: {
  readonly title: string;
  readonly topic: TopicStat | null;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {topic === null ? (
        <CardSubtitle className="mt-2">
          Not enough data to compare topics yet.
        </CardSubtitle>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-lg font-semibold">{topic.topicName}</span>
            <ScoreBadge score={topic.average} />
          </div>
          <CardSubtitle className="mt-1">
            {topic.topicSubject} · {topic.recordCount} records
          </CardSubtitle>
        </>
      )}
    </Card>
  );
}

function SubjectSummaryCard({
  subjects,
}: {
  readonly subjects: SubjectStat[];
}) {
  return (
    <Card>
      <CardTitle>Subject summary</CardTitle>
      <CardSubtitle className="mt-1">Average score grouped by subject.</CardSubtitle>
      <ul className="mt-3 divide-y divide-border text-sm">
        {subjects.map((subject) => (
          <li
            key={subject.subject}
            className="flex items-center justify-between gap-2 py-2"
          >
            <div>
              <span className="font-medium">{subject.subject}</span>
              <span className="ml-2 text-muted-foreground">
                {subject.recordCount} records
              </span>
            </div>
            <ScoreBadge score={subject.average} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DistributionCard({
  distribution,
}: {
  readonly distribution: ScoreDistribution;
}) {
  const bands = [
    {
      key: "high",
      label: "70 and above",
      count: distribution.high,
      barClass: "bg-success",
    },
    {
      key: "mid",
      label: "50–69",
      count: distribution.mid,
      barClass: "bg-warning",
    },
    {
      key: "low",
      label: "Below 50",
      count: distribution.low,
      barClass: "bg-error",
    },
  ] as const;

  return (
    <Card>
      <CardTitle>Score distribution</CardTitle>
      <CardSubtitle className="mt-1">
       Number of students in each score band.
      </CardSubtitle>
      <div className="mt-4 space-y-2">
        {bands.map((band) => {
          const width =
            distribution.total > 0
              ? (band.count / distribution.total) * 100
              : 0;
          return (
            <div key={band.key} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-muted-foreground">
                {band.label}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${band.barClass}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-medium tabular-nums">
                {band.count}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AttentionCard({
  students,
}: {
  readonly students: StudentStat[];
}) {
  return (
    <Card>
      <CardTitle>Students needing attention</CardTitle>
      {students.length === 0 ? (
        <CardSubtitle className="mt-2">
         No students currently flagged. All students with enough records are averaging 50 or above.
        </CardSubtitle>
      ) : (
        <>
          <CardSubtitle className="mt-1">
            Averaging below 50 across their recorded topics.
          </CardSubtitle>
          <ul className="mt-3 divide-y divide-border text-sm">
            {students.map((student) => (
              <li
                key={student.studentId}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div>
                  <span className="font-medium">{student.studentName}</span>
                  <span className="ml-2 text-muted-foreground">
                    {student.recordCount} records
                  </span>
                </div>
                <ScoreBadge score={student.average} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
