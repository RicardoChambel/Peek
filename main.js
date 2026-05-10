const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const os = require("os");

let mainWindow;
let imageToOpen = null;

const mediaExtensions = [
  ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif",
  ".mp4", ".webm", ".mov", ".mkv", ".avi"
];

function isMedia(filePath) {
  if (!filePath) return false;
  return mediaExtensions.includes(path.extname(filePath).toLowerCase());
}

function isImage(filePath) {
  return isMedia(filePath);
}

function getImageFromArgs(argv) {
  return argv.find(arg => isImage(arg));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 500,
        backgroundColor: "#111111",
        title: "Peek",
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    if (imageToOpen) {
      mainWindow.webContents.send("open-image", imageToOpen);
      imageToOpen = null;
    }
  });
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  imageToOpen = getImageFromArgs(process.argv);

  app.on("second-instance", (event, argv) => {
    const filePath = getImageFromArgs(argv);

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      if (filePath) {
        mainWindow.webContents.send("open-image", filePath);
      }
    }
  });

  app.whenReady().then(createWindow);
}

ipcMain.handle("choose-image", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Abrir imagem",
    properties: ["openFile"],
    filters: [
        {
            name: "Media",
            extensions: [
            "jpg", "jpeg", "png", "webp", "bmp", "gif",
            "mp4", "webm", "mov", "mkv", "avi"
            ]
        }
    ]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("get-folder-images", async (event, filePath) => {
  if (!filePath) return [];

  const folder = path.dirname(filePath);

    const files = fs
    .readdirSync(folder)
    .filter(file => isMedia(file))
    .map(file => path.join(folder, file));

  return files;
});

ipcMain.handle("path-to-file-url", async (event, filePath) => {
  return `file://${filePath.replace(/\\/g, "/")}`;
});

ipcMain.handle("window-minimize", () => {
  mainWindow.minimize();
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle("window-close", () => {
  mainWindow.close();
});

ipcMain.handle("choose-convert-output", async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save converted file",
    defaultPath: defaultName
  });

  if (result.canceled) return null;
  return result.filePath;
});

ipcMain.handle("convert-video", async (event, { inputPath, outputPath, targetFormat }) => {
  return new Promise((resolve, reject) => {
    let args = [];

    if (targetFormat === "mp4") {
      args = [
        "-y",
        "-i", inputPath,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-progress", "pipe:1",
        "-nostats",
        outputPath
      ];
    }

    if (targetFormat === "webm") {
    args = [
        "-y",
        "-i", inputPath,
        "-c:v", "libvpx",
        "-crf", "10",
        "-b:v", "2M",
        "-c:a", "libopus",
        "-progress", "pipe:1",
        "-nostats",
        outputPath
    ];
    }

    if (targetFormat === "mkv") {
      args = [
        "-y",
        "-i", inputPath,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-progress", "pipe:1",
        "-nostats",
        outputPath
      ];
    }

    if (!args.length) {
      reject("Unsupported target format");
      return;
    }

    const ffmpeg = spawn(ffmpegPath, args);

    ffmpeg.stdout.on("data", data => {
      const text = data.toString();

      const timeMatch = text.match(/out_time_ms=(\d+)/);

      if (timeMatch) {
        const outTimeMs = Number(timeMatch[1]);

        event.sender.send("convert-video-progress", {
          outTimeMs
        });
      }
    });

    ffmpeg.stderr.on("data", data => {
      console.log(data.toString());
    });

    ffmpeg.on("error", error => {
      reject(error.message);
    });

    ffmpeg.on("close", code => {
      if (code === 0) {
        event.sender.send("convert-video-progress", {
          done: true
        });

        resolve(true);
      } else {
        reject(`FFmpeg exited with code ${code}`);
      }
    });
  });
});

ipcMain.handle("get-temp-output-path", async (event, fileName) => {
  return path.join(os.tmpdir(), fileName);
});

ipcMain.handle("save-converted-file", async (event, { tempPath, finalPath }) => {
  fs.copyFileSync(tempPath, finalPath);

  try {
    fs.unlinkSync(tempPath);
  } catch {}

  return true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});