import type { View } from "./view";
import html2canvas from "html2canvas-pro";
import { Muxer, ArrayBufferTarget } from "webm-muxer";

export async function record(
  view: View,
  animation: (v: View) => Generator,
  options: {
    fps?: number;
    bitrate?: number;
  } = {},
) {
  const { fps = 60, bitrate = 5_000_000 } = options;
  const frameDuration = 1_000_000 / fps; // in microseconds

  // Capture the initial frame to get dimensions
  const initialCanvas = await html2canvas(
    view.element, {
      scale: 1,
      useCORS: true,
      logging: false,
      allowTaint: true,
      width: view.element.offsetWidth,
      height: view.element.offsetHeight,
    });
  const width = initialCanvas.width;
  const height = initialCanvas.height;

  // Create the WebM muxer
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "V_VP8",
      width,
      height,
      frameRate: fps,
    },
  });

  let frameCount = 0;

  // Configure the video encoder
  const encoder = new VideoEncoder({
    output: (chunk: EncodedVideoChunk, metadata) => {
      muxer.addVideoChunk(chunk, metadata);
    },
    error: (error: Error) => {
      console.error("Video encoding error:", error);
      throw error;
    },
  });

  encoder.configure({
    codec: "vp8",
    width,
    height,
    bitrate,
    framerate: fps,
  });

  // Helper function to encode a canvas as a video frame
  const encodeFrame = async (canvas: HTMLCanvasElement) => {
    const videoFrame = new VideoFrame(canvas, {
      timestamp: frameCount * frameDuration,
    });

    encoder.encode(videoFrame, { keyFrame: frameCount % 150 === 0 });
    videoFrame.close();
    frameCount++;
  };

  // Encode the initial frame
  await encodeFrame(initialCanvas);

  // Encode each animation frame
  for (const _ of animation(view)) {
    const canvas = await html2canvas(view.element);
    await encodeFrame(canvas);
  }

  // Flush the encoder
  await encoder.flush();
  encoder.close();

  // Finalize the muxer
  muxer.finalize();

  // Get the WebM buffer from the muxer
  const buffer = (muxer.target as ArrayBufferTarget).buffer;
  const blob = new Blob([buffer], { type: "video/webm" });

  return blob;
}
