// Maximum file size before resizing (in bytes) - 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum dimension (width or height) for resized images
const MAX_DIMENSION = 2048;

// Target quality for JPEG compression
const JPEG_QUALITY = 0.85;

interface ResizeResult {
	blob: Blob;
	resized: boolean;
	originalSize: number;
	newSize: number;
}

/**
 * Check if a file is HEIC format (common iPhone photo format)
 */
export function isHeicFile(file: File): boolean {
	const name = file.name.toLowerCase();
	return (
		name.endsWith(".heic") ||
		name.endsWith(".heif") ||
		file.type === "image/heic" ||
		file.type === "image/heif"
	);
}

/**
 * Convert HEIC/HEIF image to PNG
 * Returns the original file if not HEIC format
 */
export async function convertHeicToPng(file: File): Promise<File> {
	if (!isHeicFile(file)) {
		return file;
	}

	console.log(`Converting HEIC to PNG: ${file.name}`);

	// Lazy load heic2any only when needed (saves ~70KB from main bundle)
	const heic2any = (await import("heic2any")).default;

	const blob = await heic2any({
		blob: file,
		toType: "image/png",
		quality: 0.9,
	});

	// heic2any can return a single blob or array of blobs
	const resultBlob = Array.isArray(blob) ? blob[0] : blob;

	const newName = file.name.replace(/\.heic$/i, ".png").replace(/\.heif$/i, ".png");
	const convertedFile = new File([resultBlob], newName, { type: "image/png" });

	console.log(
		`Converted: ${file.name} → ${newName} (${(convertedFile.size / 1024 / 1024).toFixed(2)}MB)`,
	);

	return convertedFile;
}

/**
 * Check if an image file needs resizing based on file size
 */
export function needsResize(file: File): boolean {
	return file.size > MAX_FILE_SIZE;
}

/**
 * Load an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
	width: number,
	height: number,
	maxDimension: number,
): { width: number; height: number } {
	if (width <= maxDimension && height <= maxDimension) {
		return { width, height };
	}

	const ratio = Math.min(maxDimension / width, maxDimension / height);
	return {
		width: Math.round(width * ratio),
		height: Math.round(height * ratio),
	};
}

/**
 * Resize an image file if it exceeds the maximum file size
 * Returns the original file if no resize is needed
 */
export async function resizeImageIfNeeded(file: File): Promise<ResizeResult> {
	const originalSize = file.size;

	// If file is small enough, return as-is
	if (!needsResize(file)) {
		return {
			blob: file,
			resized: false,
			originalSize,
			newSize: originalSize,
		};
	}

	console.log(`Resizing image: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);

	// Load the image
	const img = await loadImage(file);
	const { width, height } = calculateDimensions(img.width, img.height, MAX_DIMENSION);

	// Create canvas and draw resized image
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	// Use better quality scaling
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(img, 0, 0, width, height);

	// Clean up object URL
	URL.revokeObjectURL(img.src);

	// Convert to blob - try WebP first, fall back to JPEG
	let blob: Blob | null = null;
	let quality = JPEG_QUALITY;

	// Try to get a small enough file
	while (quality >= 0.5) {
		blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, "image/jpeg", quality);
		});

		if (blob && blob.size <= MAX_FILE_SIZE) {
			break;
		}

		quality -= 0.1;
	}

	if (!blob) {
		throw new Error("Failed to resize image");
	}

	console.log(
		`Resized: ${width}x${height}, ${(blob.size / 1024 / 1024).toFixed(2)}MB (was ${(originalSize / 1024 / 1024).toFixed(2)}MB)`,
	);

	return {
		blob,
		resized: true,
		originalSize,
		newSize: blob.size,
	};
}

/**
 * Convert a Blob to a File object with the same name
 */
export function blobToFile(blob: Blob, originalFile: File): File {
	// Change extension to .jpg if we converted the format
	const name = originalFile.name.replace(/\.[^.]+$/, ".jpg");
	return new File([blob], name, { type: "image/jpeg" });
}
