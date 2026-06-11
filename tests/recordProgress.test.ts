import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => {
  const chain = {
    values: () => chain,
    returning: () => chain,
    all: () => [{ id: 1 }],
  };

  return { db: { insert: () => chain }, schema: {} };
});

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { recordProgress } = await import("@/lib/actions/server.actions");

describe("recordProgress score validation", () => {
  const validIds = { studentId: 1, topicId: 1 };

  it("rejects scores above 100", async () => {
    await expect(
      recordProgress({ ...validIds, score: 101 }),
    ).rejects.toThrow();
  });

  it("rejects a score one point over the upper bound", async () => {
    await expect(
      recordProgress({ ...validIds, score: 101 }),
    ).rejects.toThrow();
  });

  it("rejects scores below 0", async () => {
    await expect(
      recordProgress({ ...validIds, score: -1 }),
    ).rejects.toThrow();
  });
});