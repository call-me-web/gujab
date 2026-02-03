import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Types for the Cropper library
interface Point {
  x: number;
  y: number;
}
interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Generates the cropped image blob.
 * OPTIMIZED: Resizes large images to max 1920px and converts to WebP for storage efficiency.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // --- SMART RESIZING LOGIC ---
  // Define maximum dimension (HD Standard)
  const MAX_DIMENSION = 1920;

  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  // If image is massive, scale it down to save storage while keeping high detail
  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    const ratio = targetWidth / targetHeight;
    if (targetWidth > targetHeight) {
      targetWidth = MAX_DIMENSION;
      targetHeight = Math.round(MAX_DIMENSION / ratio);
    } else {
      targetHeight = MAX_DIMENSION;
      targetWidth = Math.round(MAX_DIMENSION * ratio);
    }
  }

  // Create a second canvas for the final resized output
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  const outputCtx = outputCanvas.getContext('2d');

  if (!outputCtx) return null;

  // Create a temporary canvas to hold the full-resolution crop first
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = pixelCrop.width;
  tempCanvas.height = pixelCrop.height;
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) return null;

  // Put full res data onto temp canvas
  tempCtx.putImageData(data, 0, 0);

  // Draw temp canvas onto output canvas with scaling (High Quality Downsampling)
  // 'imageSmoothingQuality' ensures the resize looks crisp
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = 'high';
  outputCtx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);

  // As a blob - Convert to WebP for maximum compression/quality ratio
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((file) => {
      if (file) resolve(file);
      else reject(new Error('Canvas is empty'));
    }, 'image/webp', 0.85); // 0.85 is the sweet spot for visual quality vs file size
  });
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to develop photo.');
    } finally {
      setProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onCropComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#1a1a1a] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Decorative Film Strips */}
      <div className="absolute top-0 left-0 w-full h-8 bg-black flex gap-1 overflow-hidden opacity-50 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-8 h-full bg-gray-800 border-x-4 border-black"></div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-8 bg-black flex gap-1 overflow-hidden opacity-50 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-8 h-full bg-gray-800 border-x-4 border-black"></div>
        ))}
      </div>

      <div className="w-full max-w-4xl h-[60vh] md:h-[70vh] relative border-4 border-gray-800 bg-black shadow-[0_0_50px_rgba(200,0,0,0.1)]">
        <Cropper
          image={imageSrc}
          crop={crop}
          rotation={rotation}
          zoom={zoom}
          aspect={aspect}
          onCropChange={onCropChange}
          onRotationChange={setRotation}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={setZoom}
          style={{
            containerStyle: { backgroundColor: '#000' },
            cropAreaStyle: { border: '2px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.8)' }
          }}
        />
      </div>

      <div className="w-full max-w-4xl mt-6 p-4 bg-gray-900 border-t-2 border-red-900 shadow-2xl relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-900 text-white px-4 py-0.5 font-sans-condensed text-xs font-bold uppercase tracking-widest">
          Darkroom Controls
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          {/* Aspect Ratio Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setAspect(16 / 9)}
              className={`px-3 py-1 font-sans-condensed text-xs uppercase font-bold border border-gray-600 transition-colors ${aspect === 16 / 9 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Landscape (16:9)
            </button>
            <button
              onClick={() => setAspect(4 / 3)}
              className={`px-3 py-1 font-sans-condensed text-xs uppercase font-bold border border-gray-600 transition-colors ${aspect === 4 / 3 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Standard (4:3)
            </button>
            <button
              onClick={() => setAspect(1)}
              className={`px-3 py-1 font-sans-condensed text-xs uppercase font-bold border border-gray-600 transition-colors ${aspect === 1 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Square (1:1)
            </button>
            <button
              onClick={() => setAspect(3 / 4)}
              className={`px-3 py-1 font-sans-condensed text-xs uppercase font-bold border border-gray-600 transition-colors ${aspect === 3 / 4 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Portrait (3:4)
            </button>
          </div>

          {/* Sliders */}
          <div className="flex gap-6 w-full max-w-md">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 font-sans-condensed uppercase mb-1">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 font-sans-condensed uppercase mb-1">Rotation</label>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white font-sans-condensed uppercase text-xs font-bold px-4 hover:underline"
            >
              Scrap (Cancel)
            </button>
            <button
              onClick={showCroppedImage}
              disabled={processing}
              className="bg-red-800 text-white font-sans-condensed font-bold uppercase px-6 py-2 hover:bg-red-700 transition-colors shadow-lg border border-red-900"
            >
              {processing ? 'Developing...' : 'Develop Photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};