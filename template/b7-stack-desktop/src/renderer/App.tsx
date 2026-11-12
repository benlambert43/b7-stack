import { AppShell } from "@b7-stack/ui";

import { Notes } from "@/renderer/Notes.tsx";
import { StatusChecks } from "@/renderer/StatusChecks.tsx";

export function App() {
  return (
    <AppShell title="B7 Stack" description="A new B7 Stack project.">
      <Notes />
      <StatusChecks />
    </AppShell>
  );
}
