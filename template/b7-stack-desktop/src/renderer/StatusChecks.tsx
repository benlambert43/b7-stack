import type { HealthResponse } from "@b7-stack/shared";
import { StatusRow, StatusSection } from "@b7-stack/ui";
import { Suspense, use, useState } from "react";

import { getHealth } from "@/renderer/api.ts";

// window.bridge exists only in the app's own window: the same page opened in a
// browser tab has none, and a call the main process refuses rejects.
function loadAppVersion(): Promise<string | null> {
  if (!("bridge" in window)) {
    return Promise.resolve(null);
  }
  return window.bridge.getAppVersion().catch((error: unknown) => {
    console.error("Electron main process check failed", error);
    return null;
  });
}

function MainProcessCheck({ version }: { version: Promise<string | null> }) {
  const loadedVersion = use(version);
  return loadedVersion ? (
    <StatusRow
      label="Electron main"
      state="ok"
      detail={`Version ${loadedVersion}`}
    />
  ) : (
    <StatusRow label="Electron main" state="error" />
  );
}

function ApiChecks({ health }: { health: Promise<HealthResponse | null> }) {
  const loadedHealth = use(health);
  return (
    <>
      <StatusRow label="API" state={loadedHealth ? "ok" : "error"} />
      <StatusRow
        label="Database"
        state={loadedHealth?.database === "ok" ? "ok" : "error"}
        {...(!loadedHealth && { detail: "Unknown: API unreachable" })}
      />
    </>
  );
}

export function StatusChecks() {
  const [version] = useState(loadAppVersion);
  const [health] = useState(getHealth);

  return (
    <StatusSection>
      <Suspense fallback={<StatusRow label="Electron main" state="checking" />}>
        <MainProcessCheck version={version} />
      </Suspense>
      <Suspense
        fallback={
          <>
            <StatusRow label="API" state="checking" />
            <StatusRow label="Database" state="checking" />
          </>
        }
      >
        <ApiChecks health={health} />
      </Suspense>
    </StatusSection>
  );
}
