import { view, type View } from "./anim/view";
import { record } from "./anim/record";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { el, ease, delay, sequence, all, loop } from "./anim/gen-animation";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
const playBtn = document.querySelector<HTMLButtonElement>("#playBtn")!;
const recordBtn = document.querySelector<HTMLButtonElement>("#recordBtn")!;
const shareBtn = document.querySelector<HTMLButtonElement>("#shareBtn")!;
const downloadBtn = document.querySelector<HTMLButtonElement>("#downloadBtn")!;
const editorContainer = document.querySelector<HTMLDivElement>("#editor")!;
const videoElement =
  document.querySelector<HTMLVideoElement>("#recordedVideo")!;

const show = view({
  position: "relative",
  width: "100%",
  height: "100%",
  border: "solid 1px black",
  background: "black",
});

show.mount(app);

// Default example code
const defaultCode = `// Animation helpers are available: all, el, ease, sequence, repeat, delay, loop.
// Look below the code for docs, the animation function is the one that will be played.

return function* animation(view) {
  yield* all(
    animateSquare(view, 50, 100, 'red'),
    animateSquare(view, 150, 100, 'blue'),
    animateSquare(view, 250, 100, 'green'),
  );

  yield* delay(20);
  yield* loop(2, () => animateSquare(view, 150, 100, 'yellow'));
}

function* animateSquare(view, left, top, color) {
  using square = el(view, {
    width: "50px",
    height: "50px",
    backgroundColor: color,
    position: "absolute",
    left: \`\${left}px\`,
    top: \`\${top}px\`,
  });

  yield* square.to({ left: left + 100, top, rotate: 180 }, 30, 'easeOut');
  yield* square.to({ left, top, rotate: 360 }, 30, 'easeIn');
}
/*
 * ANIMATION HELPERS DOCUMENTATION:
 *
 * el(view, style) - Creates an HTML element with the given style
 *   - Returns a ViewElement with .to() method for animations
 *   - Use 'using' keyword for automatic cleanup
 *   - Example: using box = el(view, { width: "50px", backgroundColor: "red" })
 *
 * element.to(props, duration, easing) - Animates element properties
 *   Props values must be numbers like: { left: 100, width: 20 }
 *   - props: { left, top, width, height, rotate, opacity, etc. }
 *   - duration: number of frames
 *   - easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | custom function
 *   - Example: yield* box.to({ left: 100, rotate: 180 }, 60, 'easeOut')
 *
 * all(...generators) - Runs multiple animations in parallel
 *   - Waits for all animations to complete
 *   - Example: yield* all(anim1(), anim2(), anim3())
 *
 * sequence(delayFrames, generators) - Runs animations with a staggered delay
 *   - Starts each animation after delayFrames
 *   - Example: yield* sequence(10, anim1(), anim2(100), anim3())
 *
 * delay(frames) - Pauses the animation for a number of frames
 *   - Example: yield* delay(30)
 *
 * loop(times, generator) - Repeats an animation a specific number of times
 *   - Example: yield* loop(5, () => spinAnimation())
 *
 * ease(easingFunction) - Returns an easing function
 *   - Built-in: 'linear', 'easeIn', 'easeOut', 'easeInOut'
 *   - Custom: (t: number) => number (t goes from 0 to 1)
 *   - Example: const myEase = ease((t) => t * t * t)
 */`;
// Check if preview mode is enabled
function isPreviewMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("preview") === "true";
}

// Check if autoplay mode is enabled
function isAutoplayMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("autoplay") === "true";
}

// Get code from URL parameter or use default
function getInitialCode(): string {
  const params = new URLSearchParams(window.location.search);
  const codeParam = params.get("code");

  if (codeParam) {
    try {
      // Try to decompress with lz-string first
      const decoded = decompressFromEncodedURIComponent(codeParam);
      if (decoded) {
        return decoded;
      }
      // Fallback to base64 for backward compatibility
      const decodedBase64 = atob(codeParam);
      return decodedBase64;
    } catch (error) {
      console.error("Failed to decode code from URL:", error);
      return defaultCode;
    }
  }

  return defaultCode;
}

// Initialize CodeMirror Editor
const editor = new EditorView({
  doc: getInitialCode(),
  extensions: [basicSetup, javascript(), oneDark],
  parent: editorContainer,
});

// Apply preview mode if enabled
const previewMode = isPreviewMode();
const autoplayMode = isAutoplayMode();

if (previewMode) {
  document.body.classList.add("preview-mode");
  recordBtn.style.display = "none";
  shareBtn.style.display = "none";
  downloadBtn.style.display = "none";
}

if (autoplayMode) {
  document.body.classList.add("autoplay-mode");
  // Hide all controls in autoplay mode
  const controls = document.querySelector<HTMLDivElement>("#controls")!;
  controls.style.display = "none";
}

function delayFrame() {
  return new Promise((resolve) => setTimeout(resolve, 16));
}

let animation: Generator | null = null;
let isPlaying = false;
let currentVideoBlob: Blob | null = null;

// Show animation canvas, hide video
function showAnimation() {
  app.style.display = "block";
  videoElement.style.display = "none";
}

// Show video, hide animation canvas
function showVideo() {
  app.style.display = "none";
  videoElement.style.display = "block";
}

// Compile custom animation from code editor
function compileCustomAnimation():
  | ((...args: unknown[]) => Promise<(view: View) => Generator>)
  | null {
  try {
    const code = editor.state.doc.toString();
    // Create an async function that returns the animation generator
    // Make animation helpers available in the scope
    const AsyncFunction = async function () {}.constructor as any;
    return new AsyncFunction(
      "view",
      "all",
      "el",
      "ease",
      "sequence",
      "delay",
      "loop",
      code,
    );
  } catch (error) {
    console.error("Failed to compile custom animation:", error);
    alert(
      `Failed to compile animation: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

async function getAnimationFunction(): Promise<
  ((view: View) => Generator) | null
> {
  const compiled = compileCustomAnimation();
  if (compiled) {
    try {
      return await compiled(show, all, el, ease, sequence, delay, loop);
    } catch (error) {
      console.error("Failed to execute custom animation:", error);
      alert(
        `Failed to execute animation: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  return null;
}

async function playToEnd(shouldLoop = false) {
  if (isPlaying && !shouldLoop) return;

  isPlaying = true;
  if (!autoplayMode) {
    playBtn.disabled = true;
    playBtn.classList.add("active");
  }

  // Reset video and show animation
  showAnimation();
  downloadBtn.classList.remove("show");

  try {
    // Reset animation
    show.clear();

    const animFunc = await getAnimationFunction();
    if (!animFunc) {
      throw new Error("Failed to get animation function");
    }
    animation = animFunc(show);

    let frame = animation.next();
    while (!frame.done) {
      await delayFrame();
      frame = animation.next();
    }
    await delayFrame();

    // If in autoplay mode, loop the animation
    if (shouldLoop) {
      isPlaying = false;
      setTimeout(() => playToEnd(true), 100);
      return;
    }
  } catch (error) {
    console.error("Animation error:", error);
    if (!autoplayMode) {
      alert(
        `Animation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    // Retry in autoplay mode even on error
    if (shouldLoop) {
      isPlaying = false;
      setTimeout(() => playToEnd(true), 1000);
      return;
    }
  }

  isPlaying = false;
  if (!autoplayMode) {
    playBtn.disabled = false;
    playBtn.classList.remove("active");
  }
  animation = null;
}

async function recordAnimation() {
  if (isPlaying) return;

  try {
    recordBtn.disabled = true;
    recordBtn.classList.add("active");
    recordBtn.textContent = "Recording...";

    // Show animation during recording
    showAnimation();
    downloadBtn.classList.remove("show");

    // Clear and prepare for recording
    show.clear();

    // Get the animation function to use
    const animFunc = await getAnimationFunction();
    if (!animFunc) {
      throw new Error("Failed to get animation function");
    }

    // Record the animation
    const blob = await record(show, animFunc, {
      fps: 60,
      bitrate: 5_000_000,
    });

    console.log(
      `Recording complete! Video size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
    );

    // Store the blob for download
    currentVideoBlob = blob;

    // Display the video (replacing the animation)
    const videoUrl = URL.createObjectURL(blob);
    videoElement.src = videoUrl;
    showVideo();
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
    showAnimation();
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

function shareAnimation() {
  try {
    const code = editor.state.doc.toString();

    // Compress the code using lz-string
    const compressed = compressToEncodedURIComponent(code);

    // Create the shareable URL
    const url = new URL(window.location.href);
    url.searchParams.set("code", compressed);

    // Copy to clipboard
    navigator.clipboard
      .writeText(url.toString())
      .then(() => {
        // Visual feedback
        const originalText = shareBtn.textContent;
        shareBtn.textContent = "Copied!";
        shareBtn.classList.add("active");

        setTimeout(() => {
          shareBtn.textContent = originalText;
          shareBtn.classList.remove("active");
        }, 2000);
      })
      .catch((error) => {
        console.error("Failed to copy to clipboard:", error);
        // Fallback: show the URL in a prompt
        prompt("Copy this URL to share your animation:", url.toString());
      });
  } catch (error) {
    console.error("Failed to create share URL:", error);
    alert(
      `Failed to create share URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

playBtn.addEventListener("click", () => playToEnd(false));
recordBtn.addEventListener("click", recordAnimation);
shareBtn.addEventListener("click", shareAnimation);
downloadBtn.addEventListener("click", downloadVideo);

// Initial state
recordBtn.textContent = "Record Video";
showAnimation();

// Start autoplay if enabled
if (autoplayMode) {
  playToEnd(true);
}
