import { NextResponse } from "next/server";
import { getAgents, getTasks } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = await getAgents();
  const tasks = await getTasks();
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t.title]));

  return NextResponse.json({ agents, taskMap });
}
