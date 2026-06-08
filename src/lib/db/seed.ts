import { db } from "./client";
import { progressRecords, students, topics } from "./schema";

const STUDENT_NAMES = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Katherine Johnson",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Tim Berners-Lee",
  "Barbara Liskov",
  "Edsger Dijkstra",
  "Donald Knuth",
  "Radia Perlman",
  "Anita Borg",
];

const TOPICS: Array<{ name: string; subject: string }> = [
  { name: "Fractions", subject: "Maths" },
  { name: "Algebra", subject: "Maths" },
  { name: "Geometry", subject: "Maths" },
  { name: "Photosynthesis", subject: "Science" },
  { name: "Electricity", subject: "Science" },
  { name: "Forces", subject: "Science" },
  { name: "Persuasive writing", subject: "English" },
  { name: "Comprehension", subject: "English" },
];

function deterministicScore(studentIdx: number, topicIdx: number, day: number): number {
  // Spread scores deterministically so insights pages have something to chew on.
  const base = 40 + ((studentIdx * 13 + topicIdx * 7) % 50);
  const drift = ((day * 3) % 11) - 5;
  const noise = ((studentIdx + topicIdx + day) % 7) - 3;
  const raw = base + drift + noise;
  return Math.max(0, Math.min(100, raw));
}

async function main(): Promise<void> {
  console.log("Seeding…");

  db.delete(progressRecords).run();
  db.delete(students).run();
  db.delete(topics).run();

  const studentRows = db
    .insert(students)
    .values(
      STUDENT_NAMES.map((name, i) => ({
        name,
        yearGroup: 7 + (i % 4),
      })),
    )
    .returning()
    .all();

  const topicRows = db.insert(topics).values(TOPICS).returning().all();

  const now = Math.floor(Date.now() / 1000);
  const dayStep = 60 * 60 * 24;

  const records: Array<typeof progressRecords.$inferInsert> = [];
  studentRows.forEach((student, sIdx) => {
    topicRows.forEach((topic, tIdx) => {
      for (let d = 0; d < 4; d++) {
        records.push({
          studentId: student.id,
          topicId: topic.id,
          score: deterministicScore(sIdx, tIdx, d),
          recordedAt: new Date((now - d * dayStep * 7) * 1000),
        });
      }
    });
  });

  // Batch insert in chunks to stay friendly with SQLite parameter limits.
  const chunkSize = 100;
  for (let i = 0; i < records.length; i += chunkSize) {
    db.insert(progressRecords).values(records.slice(i, i + chunkSize)).run();
  }

  console.log(
    `Seeded ${studentRows.length} students, ${topicRows.length} topics, ${records.length} progress records.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
