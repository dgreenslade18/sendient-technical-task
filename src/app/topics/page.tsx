import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { getTopics } from "@/lib/actions/server.actions";

export default async function TopicsPage() {
  const topics = await getTopics();

  const bySubject = topics.reduce<Record<string, typeof topics>>((acc, t) => {
    (acc[t.subject] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Topics</h1>
        <p className="mt-1 text-muted-foreground">
          {topics.length} topics across {Object.keys(bySubject).length} subjects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(bySubject).map(([subject, items]) => (
          <Card key={subject}>
            <CardTitle>{subject}</CardTitle>
            <CardSubtitle>{items.length} topics</CardSubtitle>
            <ul className="mt-3 space-y-1 text-sm">
              {items.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
