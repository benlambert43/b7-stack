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
    preStart: () => {
      process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} --enable-source-maps`;
      return Promise.resolve();
    },
    postStart: () => {
      if (!watchingMainBundle) {
        watchingMainBundle = true;
        fs.watchFile(mainBundle, { interval: 200 }, (now, before) => {
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
