import { useCallback, useState } from "react";
import { API_BASE } from "../config";
import type { Upload } from "../types";
import { blobToFile, resizeImageIfNeeded } from "../utils/imageResize";
import { ImagePicker } from "./ImagePicker";

interface ImageUploaderProps {
	token: string;
	selectedImages: string[];
	onImagesChange: (urls: string[]) => void;
	maxImages?: number;
}

export function ImageUploader({
	token,
	selectedImages,
	onImagesChange,
	maxImages = 14,
}: ImageUploaderProps) {
	const [uploading, setUploading] = useState(false);
	const [resizing, setResizing] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [showPicker, setShowPicker] = useState(false);

	const uploadFile = useCallback(
		async (file: File) => {
			// Check if resize is needed and resize if necessary
			setResizing(true);
			let fileToUpload = file;
			try {
				const result = await resizeImageIfNeeded(file);
				if (result.resized) {
					fileToUpload = blobToFile(result.blob, file);
				}
			} finally {
				setResizing(false);
			}

			const formData = new FormData();
			formData.append("file", fileToUpload);

			const response = await fetch(`${API_BASE}/api/uploads`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			return (await response.json()) as Upload;
		},
		[token],
	);

	const handleFiles = useCallback(
		async (files: FileList | File[]) => {
			const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
			if (fileArray.length === 0) return;

			setUploading(true);
			try {
				const newUrls: string[] = [];
				for (const file of fileArray) {
					if (selectedImages.length + newUrls.length >= maxImages) break;
					const upload = await uploadFile(file);
					newUrls.push(upload.imageUrl);
				}
				onImagesChange([...selectedImages, ...newUrls]);
			} catch (err) {
				console.error("Upload error:", err);
			} finally {
				setUploading(false);
			}
		},
		[selectedImages, maxImages, uploadFile, onImagesChange],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			handleFiles(e.dataTransfer.files);
		},
		[handleFiles],
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				handleFiles(e.target.files);
			}
		},
		[handleFiles],
	);

	const handleLibrarySelect = useCallback(
		(urls: string[]) => {
			// Add selected URLs that aren't already in the list
			const newUrls = urls.filter(url => !selectedImages.includes(url));
			onImagesChange([...selectedImages, ...newUrls]);
		},
		[selectedImages, onImagesChange],
	);

	return (
		<>
			<div className="flex gap-2">
				{/* Drop zone */}
				<div
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
					className={`flex-1 border border-dashed rounded px-2 py-1.5 text-center transition-colors ${
						dragOver
							? "border-cyan-500 bg-cyan-500/10"
							: "border-cyan-500/30 hover:border-cyan-500/50"
					}`}
				>
					<input
						type="file"
						accept="image/*"
						multiple
						onChange={handleFileInput}
						className="hidden"
						id="image-upload"
						disabled={uploading || selectedImages.length >= maxImages}
					/>
					<label htmlFor="image-upload" className="cursor-pointer block text-xs">
						{resizing ? (
							<span className="text-gray-400">Resizing...</span>
						) : uploading ? (
							<span className="text-gray-400">Uploading...</span>
						) : (
							<>
								<span className="text-gray-500">Drop or </span>
								<span className="text-cyan-400 hover:text-cyan-300">upload</span>
							</>
						)}
					</label>
				</div>

				{/* Browse Library Button */}
				<button
					type="button"
					onClick={() => setShowPicker(true)}
					className="px-3 py-1.5 text-xs cyber-card hover:neon-border rounded transition-all flex items-center gap-1.5"
				>
					<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Browse library">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					Browse
				</button>
			</div>

			{/* Image Picker Modal */}
			<ImagePicker
				token={token}
				isOpen={showPicker}
				onClose={() => setShowPicker(false)}
				onSelect={handleLibrarySelect}
				selectedUrls={selectedImages}
				maxImages={maxImages}
			/>
		</>
	);
}
