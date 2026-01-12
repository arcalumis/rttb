import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config";
import type { Upload } from "../types";
import { Button } from "./Button";
import { IconCheck } from "./Icons";
import { Modal } from "./Modal";

interface ImagePickerProps {
	token: string;
	isOpen: boolean;
	onClose: () => void;
	onSelect: (urls: string[]) => void;
	selectedUrls: string[];
	maxImages?: number;
}

interface UploadsResponse {
	uploads: Upload[];
}

export function ImagePicker({
	token,
	isOpen,
	onClose,
	onSelect,
	selectedUrls,
	maxImages = 14,
}: ImagePickerProps) {
	const [uploads, setUploads] = useState<Upload[]>([]);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState<Set<string>>(new Set(selectedUrls));

	const fetchUploads = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/uploads?trash=false`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = (await response.json()) as UploadsResponse;
			setUploads(data.uploads);
		} catch (err) {
			console.error("Failed to fetch uploads:", err);
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		if (isOpen) {
			setSelected(new Set(selectedUrls));
			fetchUploads();
		}
	}, [isOpen, fetchUploads, selectedUrls]);

	const toggleSelection = (url: string) => {
		const newSelected = new Set(selected);
		if (newSelected.has(url)) {
			newSelected.delete(url);
		} else if (newSelected.size < maxImages) {
			newSelected.add(url);
		}
		setSelected(newSelected);
	};

	const handleConfirm = () => {
		onSelect(Array.from(selected));
		onClose();
	};

	const items = uploads.map((u) => ({ id: u.id, url: u.imageUrl, label: u.originalName }));

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Upload Library"
			size="lg"
			footer={
				<div className="flex items-center justify-between">
					<span className="text-xs text-gray-400">{selected.size} / {maxImages} selected</span>
					<div className="flex gap-2">
						<Button variant="secondary" onClick={onClose}>Cancel</Button>
						<Button variant="primary" onClick={handleConfirm}>Add Selected</Button>
					</div>
				</div>
			}
		>
			{loading ? (
				<div className="flex items-center justify-center h-24">
					<span className="text-gray-400 text-sm">Loading...</span>
				</div>
			) : items.length === 0 ? (
				<div className="flex items-center justify-center h-24">
					<span className="text-gray-500 text-xs">No uploaded images yet</span>
				</div>
			) : (
				<div className="grid grid-cols-4 md:grid-cols-5 gap-2">
					{items.map((item) => {
						const isSelected = selected.has(item.url);
						const canSelect = isSelected || selected.size < maxImages;

						return (
							<button
								key={item.id}
								type="button"
								onClick={() => canSelect && toggleSelection(item.url)}
								disabled={!canSelect}
								className={`relative aspect-square rounded overflow-hidden cyber-card ${
									!canSelect ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:neon-border"
								} ${isSelected ? "ring-2 ring-cyan-500" : ""}`}
							>
								<img
									src={`${API_BASE}${item.url}`}
									alt={item.label}
									className="w-full h-full object-cover"
									loading="lazy"
								/>
								{isSelected && (
									<div className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
										<IconCheck className="w-2.5 h-2.5 text-white" />
									</div>
								)}
							</button>
						);
					})}
				</div>
			)}
		</Modal>
	);
}
