const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("peekAPI", {
  chooseImage: () => ipcRenderer.invoke("choose-image"),

  getFolderImages: (filePath) =>
    ipcRenderer.invoke("get-folder-images", filePath),

  pathToFileUrl: (filePath) => ipcRenderer.invoke("path-to-file-url", filePath),

  getPathForFile: (file) => webUtils.getPathForFile(file),

  chooseConvertOutput: (defaultName) =>
    ipcRenderer.invoke("choose-convert-output", defaultName),

  convertVideo: data =>
  ipcRenderer.invoke("convert-video", data),

onConvertVideoProgress: callback => {
  ipcRenderer.on("convert-video-progress", (event, data) => callback(data));
},

  getTempOutputPath: (fileName) =>
    ipcRenderer.invoke("get-temp-output-path", fileName),

  saveConvertedFile: (data) => ipcRenderer.invoke("save-converted-file", data),

  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),

  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),

  closeWindow: () => ipcRenderer.invoke("window-close"),

  onOpenImage: (callback) => {
    ipcRenderer.on("open-image", (event, filePath) => callback(filePath));
  },
});
