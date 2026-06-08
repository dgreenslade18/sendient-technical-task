import Link from "next/link";
import { Card, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { getStudents } from "@/lib/actions/server.actions";

export default async function StudentsPage() {
  const rows = await getStudents();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="mt-1 text-muted-foreground">
          {rows.length} students tracked.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Year</th>
              <th className="px-3 py-2 font-medium">Joined</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  Year {s.yearGroup}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(s.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/students/${s.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardTitle>No students yet</CardTitle>
          <CardSubtitle>
            Run <code>pnpm db:seed</code> to populate the database with sample
            data.
          </CardSubtitle>
        </Card>
      ) : null}
    </div>
  );
}
