import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const OUTPUT_DIR = join(process.cwd(), "..", "data", "agent-output");

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  try {
    const response = await readFile(
      join(OUTPUT_DIR, `${taskId}-response.txt`),
      "utf-8",
    );
    const prompt = await readFile(
      join(OUTPUT_DIR, `${taskId}-prompt.txt`),
      "utf-8",
    ).catch(() => null);

    const files = parseFileBlocks(response);

    return NextResponse.json({ response, prompt, files });
  } catch {
    return NextResponse.json({ error: "No output found" }, { status: 404 });
  }
}

interface ParsedFile {
  path: string;
  content: string;
}

function parseFileBlocks(text: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  const regex = /--- FILE: (.+?) ---\n```?\w*\n?([\s\S]*?)```?\n--- END FILE ---/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    files.push({
      path: match[1].trim(),
      content: match[2].trim(),
    });
  }

  if (files.length === 0) {
    const simpleRegex = /--- FILE: (.+?) ---\n([\s\S]*?)--- END FILE ---/g;
    while ((match = simpleRegex.exec(text)) !== null) {
      let content = match[2].trim();
      content = content.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      files.push({
        path: match[1].trim(),
        content: content.trim(),
      });
    }
  }

  return files;
}
