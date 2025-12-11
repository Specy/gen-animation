import { view } from "./anim/view";
import { record } from "./anim/record";
import { playAnimation } from "./animation";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#animation")!;
const playBtn = document.querySelector<HTMLButtonElement>("#playBtn")!;
const recordBtn = document.querySelector<HTMLButtonElement>("#recordBtn")!;
const downloadBtn = document.querySelector<HTMLButtonElement>("#downloadBtn")!;

const show = view({
  position: "relative",
  width: "100%",
  height: "100%",
  border: "solid 1px black",
  background: "black",
});

show.mount(app);

function delayFrame() {
  return new Promise((resolve) => setTimeout(resolve, 16));
}

let animation: Generator | null = null;
let isPlaying = false;

async function playToEnd() {
  if (isPlaying) return;

  isPlaying = true;
  playBtn.disabled = true;
  playBtn.classList.add("active");

  // Reset animation
  show.clear();
  animation = playAnimation(show);

  let frame = animation.next();
  while (!frame.done) {
    await delayFrame();
    frame = animation.next();
  }
  await delayFrame();

  isPlaying = false;
  playBtn.disabled = false;
  playBtn.classList.remove("active");
  animation = null;
}

let currentVideoBlob: Blob | null = null;

async function recordAnimation() {
  if (isPlaying) return;

  const videoElement =
    document.querySelector<HTMLVideoElement>("#recordedVideo")!;
  const videoPlaceholder =
    document.querySelector<HTMLParagraphElement>("#videoPlaceholder")!;

  try {
    recordBtn.disabled = true;
    recordBtn.classList.add("active");
    recordBtn.textContent = "Recording...";

    // Clear and prepare for recording
    show.clear();

    // Record the animation
    const blob = await record(show, playAnimation, {
      fps: 60,
      bitrate: 5_000_000,
    });

    console.log(
      `Recording complete! Video size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    );

    // Store the blob for download
    currentVideoBlob = blob;

    // Display the video
    const videoUrl = URL.createObjectURL(blob);
    videoElement.src = videoUrl;
    videoElement.style.display = "block";
    videoPlaceholder.style.display = "none";
    downloadBtn.classList.add("show");

    // Clean up the URL when the video is loaded
    videoElement.onloadeddata = () => {
      console.log("Video loaded and ready to play");
    };

    recordBtn.textContent = "Record Video";
    recordBtn.classList.remove("active");
  } catch (error) {
    console.error("Recording failed:", error);
    alert(
      `Recording failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    recordBtn.textContent = "Record Video";
    recordBtn.classList.remove("active");
  } finally {
    recordBtn.disabled = false;
  }
}

function downloadVideo() {
  if (!currentVideoBlob) return;

  const url = URL.createObjectURL(currentVideoBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "animation.webm";
  a.click();
  URL.revokeObjectURL(url);
}

playBtn.addEventListener("click", playToEnd);
recordBtn.addEventListener("click", recordAnimation);
downloadBtn.addEventListener("click", downloadVideo);

// Initial state
recordBtn.textContent = "Record Video";
