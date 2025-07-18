import { app, BrowserWindow, ipcMain, dialog, shell, protocol } from "electron";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import fs from "fs";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL(".", import.meta.url));

let mainWindow: BrowserWindow | undefined;

// Register the custom protocol
function setupCustomProtocol() {
  protocol.registerFileProtocol("kasset", (request, callback) => {
    const filePath = request.url.replace("kasset://", "");
    const decodedPath = decodeURIComponent(filePath);

    try {
      const resolvedPath = path.resolve(decodedPath);
      if (fs.existsSync(resolvedPath)) {
        callback(resolvedPath);
      } else {
        callback({ error: -6 }); // FILE_NOT_FOUND
      }
    } catch (error) {
      console.error("Error handling kasset protocol:", error);
      callback({ error: -2 }); // FAILED
    }
  });
}

async function createWindow() {
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
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          "electron-preload" + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION
        )
      ),
    },
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
  // Set up the custom protocol before creating the window
  setupCustomProtocol();
  createWindow();
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});

ipcMain.on("close-app", () => {
  app.quit();
});

ipcMain.handle("get-app-path", async () => {
  const appDir = process.resourcesPath;
  return appDir
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

    // Open the file with the default application
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error("Error opening file:", error);
    return { success: false, error: "Error opening file" };
  }
});

// For reading file content (if needed)
ipcMain.handle("read-file", async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    const content = await fs.promises.readFile(filePath);
    return { content, path: filePath, buffer: Buffer.from(content) };
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
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
    console.error("Error reading file:", error);
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
    console.error("Error getting file URL:", error);
    throw error;
  }
});
