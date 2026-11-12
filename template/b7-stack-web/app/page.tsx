import { AppShell } from "@b7-stack/ui";

import { Notes } from "@/app/_components/Notes.tsx";
import { StatusChecks } from "@/app/_components/StatusChecks.tsx";

export default function Home() {
  return (
    <AppShell title="B7 Stack" description="A new B7 Stack project.">
      <Notes />
      <StatusChecks />
    </AppShell>
  );
}
