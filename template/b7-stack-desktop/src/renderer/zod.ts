import { z } from "zod";

// Zod compiles its parsers with eval where it can, and it tests for that the
// first time a schema is built. The window's Content-Security-Policy forbids
// eval, so this has Zod interpret its schemas instead of reporting a violation.
// It has to run before any schema exists, which is why index.tsx imports it first.
z.config({ jitless: true });
