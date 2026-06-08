import { ProgressForm } from "@/components/ProgressForm";
import { getStudents, getTopics } from "@/lib/actions/server.actions";

export default async function NewProgressPage() {
  const [students, topics] = await Promise.all([getStudents(), getTopics()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Record progress</h1>
        <p className="mt-1 text-muted-foreground">
          Log a score for a student on a topic.
        </p>
      </div>
      <ProgressForm students={students} topics={topics} />
    </div>
  );
}
