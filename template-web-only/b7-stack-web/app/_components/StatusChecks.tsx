import { connection } from "next/server";
import { Suspense } from "react";

import { getApiHealth } from "@/app/_lib/apiHealth.ts";
import { StatusRow } from "@/app/_components/StatusRow.tsx";

async function BffCheck() {
  await connection();
  return (
    <StatusRow
      label="Next.js BFF"
      state="ok"
      detail={`Rendered at ${new Date().toISOString()}`}
    />
  );
}

async function ApiChecks() {
  await connection();
  const health = await getApiHealth();
  return (
    <>
      <StatusRow label="API" state={health ? "ok" : "error"} />
      <StatusRow
        label="Database"
        state={health?.database === "ok" ? "ok" : "error"}
        {...(!health && { detail: "Unknown: API unreachable" })}
      />
    </>
  );
}

export function StatusChecks() {
  return (
    <section className="w-full max-w-sm text-left">
      <h2
        className="text-sm font-semibold tracking-wide text-zinc-500 uppercase"
      >
        System status
      </h2>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <Suspense fallback={<StatusRow label="Next.js BFF" state="checking" />}>
          <BffCheck />
        </Suspense>
        <Suspense
          fallback={
            <>
              <StatusRow label="API" state="checking" />
              <StatusRow label="Database" state="checking" />
            </>
          }
        >
          <ApiChecks />
        </Suspense>
      </ul>
    </section>
  );
}
