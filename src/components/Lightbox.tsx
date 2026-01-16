import { useEffect, useState } from "react";
import { IconClose, IconDownload, IconRotate } from "./Icons";

interface LightboxProps {
	imageUrl: string;
	alt?: string;
	onClose: () => void;
	rotation?: number;
}

export function Lightbox({ imageUrl, alt = "Image", onClose, rotation: initialRotation = 0 }: LightboxProps) {
	const [localRotation, setLocalRotation] = useState(initialRotation);

	const handleRotate = () => {
		setLocalRotation((prev) => (prev + 90) % 360);
	};

	// Close on escape key, rotate on R key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			} else if (e.key === "r" || e.key === "R") {
				handleRotate();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	// Prevent body scroll when lightbox is open
	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	return (
		<div
			className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
			onClick={onClose}
		>
			{/* Close button */}
			<button
				type="button"
				onClick={onClose}
				className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
				title="Close (Esc)"
			>
				<IconClose className="w-8 h-8" />
			</button>

			{/* Rotate button */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					handleRotate();
				}}
				className="absolute top-4 right-28 p-2 text-white/70 hover:text-white transition-colors z-10"
				title="Rotate (R)"
			>
				<IconRotate className="w-8 h-8" />
			</button>

			{/* Download button */}
			<a
				href={imageUrl}
				download
				onClick={(e) => e.stopPropagation()}
				className="absolute top-4 right-16 p-2 text-white/70 hover:text-white transition-colors z-10"
				title="Download"
			>
				<IconDownload className="w-8 h-8" />
			</a>

			{/* Image container */}
			<div
				className="max-w-[95vw] max-h-[95vh] flex items-center justify-center"
				onClick={(e) => e.stopPropagation()}
			>
				<img
					src={imageUrl}
					alt={alt}
					className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
					style={{ transform: localRotation ? `rotate(${localRotation}deg)` : undefined }}
				/>
			</div>
		</div>
	);
}
