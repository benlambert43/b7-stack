import fs from "node:fs";
import path from "node:path";

import { requestAppRestart } from "@electron-forge/core-utils/restart";
import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const mainBundle = path.join(import.meta.dirname, ".vite/build/main.cjs");
let watchingMainBundle = false;

const config: ForgeConfig = {
  packagerConfig: { asar: true },
  makers: [new MakerZIP()],
  hooks: {
    // The dev build comes with source maps, which Node.js only reads when it
    // is started with this option. With it, a stack trace from the main
    // process points at the TypeScript source instead of the bundle.
    preStart: () => {
      process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} --enable-source-maps`;
      return Promise.resolve();
    },
    // Restarts the app when Vite rebuilds the main process. The plugin's own
    // hotRestart option is meant to do this but is ignored in Forge 8.0.1
    // (electron/forge#4446); once that is fixed, set it and remove this hook.
    postStart: () => {
      if (!watchingMainBundle) {
        watchingMainBundle = true;
        fs.watchFile(mainBundle, { interval: 200 }, (now, before) => {
          // Only a development build comes with a source map. Packaging
          // deletes .vite and writes a production bundle in its place, which
          // the running dev app must not be restarted onto.
          const rebuilt =
            now.mtimeMs !== before.mtimeMs &&
            fs.existsSync(`${mainBundle}.map`);
          if (rebuilt && !requestAppRestart()) {
            console.warn(
              "The main process changed, but Forge could not restart the app.",
            );
          }
        }).unref();
      }
      return Promise.resolve();
    },
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: { main: "src/main/index.ts" },
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: { preload: "src/preload/index.ts" },
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [{ name: "main_window", config: "vite.renderer.config.ts" }],
    }),
    // Switches off the ways a packaged Electron binary can be made to run other
    // code. On macOS and Windows it also verifies app.asar before loading it;
    // Electron has no such check on Linux.
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    }),
  ],
};

export default config;
