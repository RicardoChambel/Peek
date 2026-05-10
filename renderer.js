const openBtn = document.getElementById("openBtn");
const photo = document.getElementById("photo");
const video = document.getElementById("video");
const videoWrapper = document.getElementById("videoWrapper");
const videoClickArea = document.getElementById("videoClickArea");
const playRipple = document.getElementById("playRipple");
const ripplePlay = playRipple.querySelector(".ripple-play");
const ripplePause = playRipple.querySelector(".ripple-pause");
const videoControls = document.getElementById("videoControls");
const imageArea = document.getElementById("imageArea");
const dropOverlay = document.getElementById("dropOverlay");
const emptyState = document.getElementById("emptyState");
const fileName = document.getElementById("fileName");
const fileDot = document.getElementById("fileDot");
const counter = document.getElementById("counter");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const themeBtn = document.getElementById("themeBtn");
const html = document.documentElement;
const minimizeBtn = document.getElementById("minimizeBtn");
const maximizeBtn = document.getElementById("maximizeBtn");
const closeBtn = document.getElementById("closeBtn");

// Video controls elements
const playPauseBtn = document.getElementById("playPauseBtn");
const iconPlay = playPauseBtn.querySelector(".icon-play");
const iconPause = playPauseBtn.querySelector(".icon-pause");
const muteBtn = document.getElementById("muteBtn");
const iconVol = muteBtn.querySelector(".icon-vol");
const iconMute = muteBtn.querySelector(".icon-mute");
const volumeSlider = document.getElementById("volumeSlider");
const vcTime = document.getElementById("vcTime");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const iconFs = fullscreenBtn.querySelector(".icon-fs");
const iconFsExit = fullscreenBtn.querySelector(".icon-fs-exit");
const progressWrap = document.getElementById("progressWrap");
const progressTrack = document.getElementById("progressTrack");
const progressFill = document.getElementById("progressFill");
const progressBuffered = document.getElementById("progressBuffered");
const progressThumb = document.getElementById("progressThumb");
const timeTooltip = document.getElementById("timeTooltip");

const converterBtn = document.getElementById("converterBtn");
const converterPanel = document.getElementById("converterPanel");
const closeConverterBtn = document.getElementById("closeConverterBtn");
const converterInput = document.getElementById("converterInput");
const converterDrop = document.getElementById("converterDrop");
const converterFileText = document.getElementById("converterFileText");
const currentFormat = document.getElementById("currentFormat");
const targetFormat = document.getElementById("targetFormat");
const convertBtn = document.getElementById("convertBtn");
const converterStatus = document.getElementById("converterStatus");
const converterProgress = document.querySelector(".converter-progress");
const converterProgressFill = document.getElementById("converterProgressFill");
let currentVideoDurationMs = 0;
const converterEmpty = document.getElementById("converterEmpty");
const converterPreviewImage = document.getElementById("converterPreviewImage");
const converterPreviewVideo = document.getElementById("converterPreviewVideo");
const converterPreviewOverlay = document.getElementById("converterPreviewOverlay");
const converterPreviewType = document.getElementById("converterPreviewType");
const converterPreviewName = document.getElementById("converterPreviewName");

const viewerPath = document.getElementById("viewerPath");

let converterFile = null;


let images = [];
let currentIndex = -1;

/* ── THEME ── */
const savedTheme = localStorage.getItem("peek-theme") || "dark";
html.setAttribute("data-theme", savedTheme);

themeBtn.addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("peek-theme", next);
});

/* ── HELPERS ── */
function getBaseName(p) {
  return p.split(/[\\/]/).pop();
}
function ext(p) {
  return p.split(".").pop().toLowerCase();
}
function isVideo(p) {
  return ["mp4", "webm", "mov", "mkv", "avi"].includes(ext(p));
}
function isImage(p) {
  return ["jpg", "jpeg", "png", "webp", "bmp", "gif"].includes(ext(p));
}
function isSupportedMedia(p) {
  return isImage(p) || isVideo(p);
}

function formatTime(s) {
  if (isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

/* ── VIDEO PLAYER LOGIC ── */

// Play / Pause
function setPlayState(playing) {
  iconPlay.style.display = playing ? "none" : "block";
  iconPause.style.display = playing ? "block" : "none";
}

function triggerRipple(playing) {
  ripplePlay.style.display = playing ? "block" : "none";
  ripplePause.style.display = playing ? "none" : "block";
  playRipple.classList.remove("show");
  void playRipple.offsetWidth;
  playRipple.classList.add("show");
}

function togglePlay() {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

videoClickArea.addEventListener("click", togglePlay);
playPauseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  togglePlay();
});

video.addEventListener("play", () => {
  setPlayState(true);
});
video.addEventListener("pause", () => {
  setPlayState(false);
});
video.addEventListener("play", () => triggerRipple(true));
video.addEventListener("pause", () => triggerRipple(false));

// Remove ripple show class after animation
playRipple.addEventListener("animationend", () =>
  playRipple.classList.remove("show"),
);

// Progress bar
video.addEventListener("timeupdate", () => {
  if (!video.duration) return;
  const pct = (video.currentTime / video.duration) * 100;
  progressFill.style.width = pct + "%";
  progressThumb.style.left = pct + "%";
  vcTime.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
});

video.addEventListener("progress", () => {
  if (!video.duration || !video.buffered.length) return;
  const pct =
    (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
  progressBuffered.style.width = pct + "%";
});

video.addEventListener("loadedmetadata", () => {
  vcTime.textContent = `0:00 / ${formatTime(video.duration)}`;
  progressFill.style.width = "0%";
  progressThumb.style.left = "0%";
  progressBuffered.style.width = "0%";
});

// Scrubbing
let isScrubbing = false;

function scrubTo(e) {
  const rect = progressTrack.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  video.currentTime = pct * video.duration;
  progressFill.style.width = pct * 100 + "%";
  progressThumb.style.left = pct * 100 + "%";
}

function updateTooltip(e) {
  if (!video.duration) return;
  const rect = progressTrack.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const t = pct * video.duration;
  timeTooltip.textContent = formatTime(t);
  timeTooltip.style.left = pct * 100 + "%";
}

progressWrap.addEventListener("mousedown", (e) => {
  isScrubbing = true;
  scrubTo(e);
  updateTooltip(e);
  videoWrapper.classList.add("controls-locked");
});

progressWrap.addEventListener("mousemove", (e) => {
  updateTooltip(e);
  if (isScrubbing) scrubTo(e);
});

document.addEventListener("mousemove", (e) => {
  if (isScrubbing) scrubTo(e);
});

document.addEventListener("mouseup", () => {
  if (isScrubbing) {
    isScrubbing = false;
    videoWrapper.classList.remove("controls-locked");
  }
});

// Volume
volumeSlider.addEventListener("input", () => {
  video.volume = volumeSlider.value;
  video.muted = video.volume === 0;
  updateMuteIcon();
});

function updateMuteIcon() {
  const muted = video.muted || video.volume === 0;
  iconVol.style.display = muted ? "none" : "block";
  iconMute.style.display = muted ? "block" : "none";
}

muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  if (!video.muted && video.volume === 0) {
    video.volume = 0.5;
    volumeSlider.value = 0.5;
  }
  updateMuteIcon();
});

// Fullscreen
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    videoWrapper.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  const isFs = !!document.fullscreenElement;
  iconFs.style.display = isFs ? "none" : "block";
  iconFsExit.style.display = isFs ? "block" : "none";
});

// Keyboard shortcuts
document.addEventListener("keydown", async (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT") return;

  if (e.key === "ArrowLeft" && !videoWrapper.classList.contains("active"))
    prevBtn.click();
  if (e.key === "ArrowRight" && !videoWrapper.classList.contains("active"))
    nextBtn.click();
  if (e.key === " " && videoWrapper.classList.contains("active")) {
    e.preventDefault();
    togglePlay();
  }
  if (e.key === "m" && videoWrapper.classList.contains("active"))
    muteBtn.click();
  if (e.key === "f" && videoWrapper.classList.contains("active"))
    fullscreenBtn.click();
  if (e.key === "ArrowLeft" && videoWrapper.classList.contains("active")) {
    e.preventDefault();
    video.currentTime = Math.max(0, video.currentTime - 5);
  }
  if (e.key === "ArrowRight" && videoWrapper.classList.contains("active")) {
    e.preventDefault();
    video.currentTime = Math.min(video.duration, video.currentTime + 5);
  }
});

/* ── SHOW MEDIA ── */
async function showMedia(filePath) {
  const fileUrl = await window.peekAPI.pathToFileUrl(filePath);

  photo.style.display = "none";
  videoWrapper.classList.remove("active");
  video.pause();
  video.src = "";

  emptyState.style.display = "none";

  if (isVideo(filePath)) {
    videoWrapper.classList.add("active");
    video.src = fileUrl;
    video.load();
    video.play().catch(() => {});
    setPlayState(true);
  } else {
    photo.onload = () => {
      photo.style.display = "block";
      photo.style.animation = "none";
      void photo.offsetWidth;
      photo.style.animation = "";
    };
    photo.src = fileUrl;
  }

  fileName.textContent = filePath;
  fileDot.classList.add("visible");
  counter.textContent = `${currentIndex + 1} / ${images.length}  ·  ${ext(filePath).toUpperCase()}`;
  updateButtons();
}

function updateButtons() {
  const hasMany = images.length > 1;
  prevBtn.disabled = !hasMany;
  nextBtn.disabled = !hasMany;
}

async function loadImage(filePath) {
  images = await window.peekAPI.getFolderImages(filePath);
  currentIndex = images.findIndex((img) => img === filePath);
  if (currentIndex === -1) {
    images = [filePath];
    currentIndex = 0;
  }
  await showMedia(images[currentIndex]);
}

/* ── EVENTS ── */
openBtn.addEventListener("click", async () => {
  const filePath = await window.peekAPI.chooseImage();
  if (filePath) await loadImage(filePath);
});

prevBtn.addEventListener("click", async () => {
  if (!images.length) return;
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  await showMedia(images[currentIndex]);
});

nextBtn.addEventListener("click", async () => {
  if (!images.length) return;
  currentIndex = (currentIndex + 1) % images.length;
  await showMedia(images[currentIndex]);
});

minimizeBtn.addEventListener("click", () => {
  window.peekAPI.minimizeWindow();
});

maximizeBtn.addEventListener("click", () => {
  window.peekAPI.maximizeWindow();
});

closeBtn.addEventListener("click", () => {
  window.peekAPI.closeWindow();
});

window.peekAPI.onOpenImage(async (filePath) => {
  await loadImage(filePath);
});

/* ── DRAG & DROP ── */
window.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropOverlay.classList.add("visible");
});

window.addEventListener("dragleave", (e) => {
  if (e.clientX === 0 && e.clientY === 0)
    dropOverlay.classList.remove("visible");
});

window.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropOverlay.classList.remove("visible");
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const filePath = window.peekAPI.getPathForFile(file);
  if (!filePath || !isSupportedMedia(filePath)) {
    fileName.textContent = "Unsupported format";
    fileDot.classList.remove("visible");
    counter.textContent = "—";
    return;
  }
  await loadImage(filePath);
});

/* ── FORMAT CONVERTER ── */
const convertOptions = {
  png: ["jpg", "webp"],
  jpg: ["png", "webp"],
  jpeg: ["png", "webp"],
  webp: ["png", "jpg"],
  bmp: ["png", "jpg", "webp"],
  gif: ["png", "jpg", "webp"],

  mp4: ["webm", "mkv"],
  webm: ["mp4", "mkv"],
  mov: ["mp4", "webm", "mkv"],
  mkv: ["mp4", "webm"],
  avi: ["mp4", "webm", "mkv"],
};

const mimeByFormat = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function openConverter() {
  converterPanel.classList.add("visible");
}

function closeConverter() {
  converterPanel.classList.remove("visible");
}

function resetConverter() {
  converterFile = null;
  converterInput.value = "";
  currentFormat.textContent = "—";
  targetFormat.innerHTML = `<option value="">Choose format</option>`;
  convertBtn.disabled = true;
  converterStatus.textContent = "";
  clearConverterPreview();
}

function startConverterProgress() {
  converterProgress.classList.add("active");
  converterProgressFill.style.width = "0%";
}

function updateConverterProgress(percent) {
  converterProgressFill.style.width = `${percent}%`;
}

function finishConverterProgress() {
  converterProgressFill.style.width = "100%";

  setTimeout(() => {
    converterProgress.classList.remove("active");
    converterProgressFill.style.width = "0%";
  }, 700);
}

async function getVideoDurationMs(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement("video");

    tempVideo.preload = "metadata";

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(tempVideo.duration * 1000000);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };

    tempVideo.src = url;
  });
}

function getFileExtensionFromName(name) {
  return name.split(".").pop().toLowerCase();
}

function fillTargetFormats(sourceFormat) {
  const options = convertOptions[sourceFormat] || [];

  targetFormat.innerHTML = `<option value="">Choose format</option>`;

  options.forEach((format) => {
    const option = document.createElement("option");
    option.value = format;
    option.textContent = format.toUpperCase();
    targetFormat.appendChild(option);
  });

  convertBtn.disabled = true;
}

function setConverterFile(file) {
  if (!file) return;

  const sourceFormat = getFileExtensionFromName(file.name);

  if (!convertOptions[sourceFormat]) {
    converterStatus.textContent = "Unsupported media format";
    return;
  }

  converterFile = file;
  updateConverterPreview(file);

  currentFormat.textContent = sourceFormat.toUpperCase();
  converterStatus.textContent = "";

  fillTargetFormats(sourceFormat);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  a.remove();
  URL.revokeObjectURL(url);
}

async function convertImageFile(file, target) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const mimeType = mimeByFormat[target];

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("Conversion failed"));
            return;
          }

          resolve(blob);
        },
        mimeType,
        0.92,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };

    img.src = url;
  });
}

converterBtn.addEventListener("click", openConverter);

closeConverterBtn.addEventListener("click", closeConverter);

converterPanel.addEventListener("click", (e) => {
  if (e.target === converterPanel) {
    closeConverter();
  }
});

converterInput.addEventListener("change", () => {
  setConverterFile(converterInput.files[0]);
});

targetFormat.addEventListener("change", () => {
  convertBtn.disabled = !converterFile || !targetFormat.value;
});

converterDrop.addEventListener("dragover", (e) => {
  e.preventDefault();
  converterDrop.classList.add("dragging");
});

converterDrop.addEventListener("dragleave", () => {
  converterDrop.classList.remove("dragging");
});

converterDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  converterDrop.classList.remove("dragging");

  const file = e.dataTransfer.files[0];
  setConverterFile(file);
});

convertBtn.addEventListener("click", async () => {
  if (!converterFile || !targetFormat.value) return;

  try {
    converterStatus.textContent = "Converting...";
    startConverterProgress();

    const source = getFileExtensionFromName(converterFile.name);
    const target = targetFormat.value;

    const originalName = converterFile.name.replace(/\.[^/.]+$/, "");
    const outputName = `${originalName}.${target}`;

    // IMAGE CONVERSION
    if (isImageFormat(source) && isImageFormat(target)) {
      const blob = await convertImageFile(converterFile, target);

      converterStatus.textContent = "Preparing download...";

      downloadBlob(blob, outputName);

      converterStatus.textContent = "Conversion complete";
      finishConverterProgress();
      return;
    }

    // VIDEO CONVERSION
    if (isVideoFormat(source) && isVideoFormat(target)) {
      const inputPath = window.peekAPI.getPathForFile(converterFile);

      currentVideoDurationMs = await getVideoDurationMs(converterFile);

      const tempOutputPath = await window.peekAPI.getTempOutputPath(outputName);

      await window.peekAPI.convertVideo({
        inputPath,
        outputPath: tempOutputPath,
        targetFormat: target,
      });

      const finalPath = await window.peekAPI.chooseConvertOutput(outputName);

      if (!finalPath) {
        converterStatus.textContent = "Conversion complete (not saved)";
        finishConverterProgress();
        return;
      }

      await window.peekAPI.saveConvertedFile({
        tempPath: tempOutputPath,
        finalPath,
      });

      converterStatus.textContent = "Conversion complete";
      finishConverterProgress();
      return;
    }

    converterStatus.textContent = "Incompatible conversion";
  } catch (error) {
    console.error(error);
    converterStatus.textContent = "Conversion failed";
    converterProgress.classList.remove("active");
    converterProgressFill.style.width = "0%";
  }
});

function isImageFormat(format) {
  return ["png", "jpg", "jpeg", "webp", "bmp", "gif"].includes(format);
}

function isVideoFormat(format) {
  return ["mp4", "webm", "mov", "mkv", "avi"].includes(format);
}

window.peekAPI.onConvertVideoProgress((data) => {
  if (data.done) {
    updateConverterProgress(100);
    return;
  }

  if (!currentVideoDurationMs || !data.outTimeMs) return;

  const percent = Math.min(
    99,
    Math.round((data.outTimeMs / currentVideoDurationMs) * 100),
  );

  updateConverterProgress(percent);
  converterStatus.textContent = `Converting... ${percent}%`;
});

function clearConverterPreview() {
  converterPreviewImage.classList.remove("visible");
  converterPreviewVideo.classList.remove("visible");
  converterPreviewOverlay.classList.remove("visible");
  converterEmpty.classList.remove("hidden");

  converterPreviewImage.src = "";
  converterPreviewVideo.pause();
  converterPreviewVideo.src = "";
}

function updateConverterPreview(file) {
  clearConverterPreview();

  if (!file) return;

  const format = getFileExtensionFromName(file.name);
  const url = URL.createObjectURL(file);

  converterEmpty.classList.add("hidden");
  converterPreviewOverlay.classList.add("visible");
  converterPreviewType.textContent = format.toUpperCase();
  converterPreviewName.textContent = file.name;

  if (isImageFormat(format)) {
    converterPreviewImage.src = url;
    converterPreviewImage.classList.add("visible");
    return;
  }

  if (isVideoFormat(format)) {
    converterPreviewVideo.src = url;
    converterPreviewVideo.classList.add("visible");
    converterPreviewVideo.currentTime = 0.1;

    converterPreviewVideo.onloadeddata = () => {
      converterPreviewVideo.pause();
    };
  }
}

updateButtons();
