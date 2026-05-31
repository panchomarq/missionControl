import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { getAgents, getTasks } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Personal OS — Terminal RPG Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const agents = await getAgents();
  const tasks = await getTasks();
  const taskSummary = tasks.map((t) => ({ id: t.id, title: t.title }));

  return (
    <html lang="en">
      <body>
        <Sidebar agents={agents} tasks={taskSummary} />
        <main
          className="scanline"
          style={{ marginLeft: 210, minHeight: "100vh", padding: "32px 40px" }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
