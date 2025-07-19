import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  protocol,
  session,
  ProtocolRequest,
} from "electron";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import fs from "fs";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL(".", import.meta.url));

let mainWindow: BrowserWindow | undefined;

//TODO: Any smart person can help me with video not loopable with this URL variant?
function setupCustomProtocol(session: any) {
  session.protocol.registerFileProtocol(
    "kasset",
    (request: ProtocolRequest, callback: any) => {
      const filePath = request.url.replace("kasset://", "");
      const decodedPath = decodeURIComponent(filePath);
      try {
        const resolvedPath = path.resolve(decodedPath);
        if (fs.existsSync(resolvedPath)) {
          const contentType = getContentType(resolvedPath);
          callback({
            statusCode: 206,
            path: resolvedPath,
            mimeType: contentType,
          });
        } else {
          callback({ error: -6 });
        }
      } catch (error) {
        console.error("Error handling kasset protocol:", error);
        callback({ error: -2 });
      }
    }
  );
}

function getContentType(filePath: string) {
  const extname = path.extname(filePath);
  switch (extname) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

async function createWindow(partition: string) {
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, "icons/icon.png"),
    width: 1000,
    height: 600,
    maximizable: true,
    useContentSize: true,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      sandbox: false,
      partition,
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          "electron-preload" + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION
        )
      ),
    },
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F11") {
      event.preventDefault();
      mainWindow?.setFullScreen(!mainWindow?.isFullScreen());
    }
  });

  mainWindow.setMenu(null);
  mainWindow.maximize();

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadFile("index.html");
  }

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

app.whenReady().then(() => {
  console.log("Registering protocol...");

  const partition = "persist:karaokeapp";
  const ses = session.fromPartition(partition);

  setupCustomProtocol(ses);
  createWindow(partition);
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("close-app", () => {
  app.quit();
});

ipcMain.handle("get-app-path", async () => {
  const appDir = process.resourcesPath;
  return appDir;
});

ipcMain.handle("create-folder", async (event, folderPath) => {
  try {
    await fs.promises.mkdir(folderPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
});

ipcMain.handle("pick-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths[0] || null;
});

ipcMain.handle("open-directory", async (event, dirPath) => {
  try {
    if (!dirPath || !fs.existsSync(dirPath)) {
      throw new Error("Directory does not exist");
    }

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const contents = items.map((item) => ({
      name: item.name,
      path: path.join(dirPath, item.name),
      isDirectory: item.isDirectory(),
      isFile: item.isFile(),
    }));

    return contents;
  } catch (error) {
    console.error("Error reading directory:", error);
    throw error;
  }
});

ipcMain.handle("open-file", async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error opening file" };
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    const content = await fs.promises.readFile(filePath);
    return { content, path: filePath, buffer: Buffer.from(content) };
  } catch (error) {
    return null;
  }
});

ipcMain.handle("read-text-file", async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    const content = await fs.promises.readFile(filePath, "utf-8");
    return { content, path: filePath };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("get-file-url", async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    const orgFileUrl = path.resolve(filePath);
    const encodedPath = encodeURIComponent(orgFileUrl);

    const fileUrl = `kasset://${encodedPath}`;

    return { url: fileUrl, path: filePath };
  } catch (error) {
    throw error;
  }
});
