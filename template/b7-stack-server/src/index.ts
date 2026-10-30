import type { HealthResponse } from "@b7-stack/shared";
import cors from "cors";
import express from "express";

import { checkDatabase } from "./health.ts";
import { notesRouter } from "./notes.ts";
import { serverEnv } from "./serverEnv.ts";

const app = express();

app.use(cors({ origin: serverEnv.BASE_FRONTEND_URL }));
app.use(express.json());

app.get("/api/v1/health", async (_req, res) => {
  const database = await checkDatabase();
  const body: HealthResponse = { status: "ok", database };
  res.status(database === "ok" ? 200 : 503).json(body);
});

app.use("/api/v1/notes", notesRouter);

app.listen(serverEnv.API_PORT, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log(`b7-stack-server listening on port ${serverEnv.API_PORT}`);
});
