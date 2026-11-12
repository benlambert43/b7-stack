import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  net,
  protocol,
  session,
  shell,
} from "electron";

import { contentSecurityPolicy } from "@/contentSecurityPolicy.ts";
import { env } from "@/env.ts";
import { handlers } from "@/main/handlers.ts";

// Forge defines the dev server's address only for `electron-forge start`. Every
// production build, packaged or not, has `undefined` in its place and serves
// the built files itself over app://, which has a real origin, unlike file://.
const devServerUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL as string | undefined;
const renderer = new URL(devServerUrl ?? "app://renderer");

// Forge bundles this file as CommonJS into .vite/build, next to the preload
// script and one folder away from the renderer's files.
const preload = path.join(__dirname, "preload.cjs");
const rendererFiles = path.join(
  __dirname,
  "../renderer",
  MAIN_WINDOW_VITE_NAME,
);

const policy = contentSecurityPolicy(env.VITE_API_BASE_URL, {
  devServer: false,
});

// What the window may do without asking. Every other permission is refused,
// both when the page requests it and when Chromium only checks it.
const grantedPermissions = new Set(["clipboard-sanitized-write", "fullscreen"]);

function isRenderer(url = ""): boolean {
  const target = URL.parse(url);
  return (
    target?.protocol === renderer.protocol && target.host === renderer.host
  );
}

function decodePath(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

async function serveRendererFile(request: Request): Promise<Response> {
  const { host, pathname } = new URL(request.url);
  const decoded = decodePath(pathname);
  if (decoded === null) {
    return new Response(null, { status: 400 });
  }
  const file = path.join(rendererFiles, decoded);
  if (host !== renderer.host || !file.startsWith(rendererFiles + path.sep)) {
    return new Response(null, { status: 404 });
  }
  // net.fetch rejects for a missing file or a directory.
  const response = await net.fetch(pathToFileURL(file).href).catch(() => null);
  if (!response) {
    return new Response(null, { status: 404 });
  }
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", policy);
  return new Response(response.body, { status: response.status, headers });
}

// Links and window.open calls to https addresses open in the default browser.
function openInBrowser(url: string): void {
  if (URL.parse(url)?.protocol === "https:") {
    shell.openExternal(url).catch((error: unknown) => {
      console.error(`Could not open ${url}`, error);
    });
  }
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 960,
    height: 720,
    // Matches --background in the shared theme, so the window never flashes white.
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0a0a0a" : "#ffffff",
    webPreferences: {
      preload,
      // Keeps the compiled script from the first launch on, instead of only
      // after V8 has seen it twice within 72 hours.
      v8CacheOptions: "bypassHeatCheck",
    },
  });
  void window.loadURL(new URL("/index.html", renderer).href);
}

function showWindow(): void {
  const [window] = BrowserWindow.getAllWindows();
  if (!window) {
    createWindow();
    return;
  }
  if (window.isMinimized()) {
    window.restore();
  }
  window.focus();
}

function start(): void {
  if (!devServerUrl) {
    protocol.handle("app", serveRendererFile);
  }

  session.defaultSession.setPermissionRequestHandler(
    (_contents, permission, callback) => {
      callback(grantedPermissions.has(permission));
    },
  );
  session.defaultSession.setPermissionCheckHandler((_contents, permission) =>
    grantedPermissions.has(permission),
  );

  for (const [method, handler] of Object.entries(handlers)) {
    ipcMain.handle(method, (event, ...args: unknown[]) => {
      if (!isRenderer(event.senderFrame?.url)) {
        throw new Error(`Refused ${method} from an unexpected sender`);
      }
      return handler(...args);
    });
  }

  createWindow();
  app.on("activate", showWindow);
}

// The dev app keeps its own profile and single-instance lock, so it runs
// beside an installed copy of the app instead of handing over to it.
if (devServerUrl) {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

app.enableSandbox();

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      codeCache: true,
    },
  },
]);

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-navigate", (event) => {
    if (!isRenderer(event.url)) {
      event.preventDefault();
      openInBrowser(event.url);
    }
  });
  contents.setWindowOpenHandler(({ url }) => {
    openInBrowser(url);
    return { action: "deny" };
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// A second launch hands over to the instance that is already running.
if (app.requestSingleInstanceLock()) {
  app.on("second-instance", showWindow);
  void app.whenReady().then(start);
} else {
  app.quit();
}
