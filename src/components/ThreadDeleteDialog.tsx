import { useState } from "react";
import type { Thread } from "../types";
import { Modal } from "./Modal";

interface ThreadDeleteDialogProps {
	isOpen: boolean;
	onClose: () => void;
	thread: Thread | null;
	onConfirm: (deletePhotos: boolean) => void;
}

export function ThreadDeleteDialog({
	isOpen,
	onClose,
	thread,
	onConfirm,
}: ThreadDeleteDialogProps) {
	const [deletePhotos, setDeletePhotos] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);

	if (!thread) return null;

	const handleConfirm = async () => {
		setIsConfirming(true);
		try {
			await onConfirm(deletePhotos);
			onClose();
		} finally {
			setIsConfirming(false);
			setDeletePhotos(false);
		}
	};

	const handleClose = () => {
		setDeletePhotos(false);
		onClose();
	};

	const photoCount = thread.generationCount || 0;

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Delete Thread"
			size="sm"
			footer={
				<div className="flex gap-2 justify-end">
					<button
						type="button"
						onClick={handleClose}
						className="px-3 py-1.5 text-xs rounded border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors"
						disabled={isConfirming}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isConfirming}
						className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
							deletePhotos
								? "bg-red-500/80 hover:bg-red-500 text-white"
								: "bg-cyan-500/80 hover:bg-cyan-500 text-black"
						}`}
					>
						{isConfirming
							? "Processing..."
							: deletePhotos
								? "Delete Permanently"
								: "Archive Thread"}
					</button>
				</div>
			}
		>
			<div className="space-y-4">
				<div>
					<p className="text-sm text-[var(--text-secondary)] mb-1">Thread:</p>
					<p className="text-sm font-medium truncate">{thread.title}</p>
					{photoCount > 0 && (
						<p className="text-xs text-[var(--text-secondary)] mt-1">
							{photoCount} generation{photoCount !== 1 ? "s" : ""}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="flex items-start gap-3 p-3 rounded border border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-colors">
						<input
							type="radio"
							name="deleteOption"
							checked={!deletePhotos}
							onChange={() => setDeletePhotos(false)}
							className="mt-0.5 accent-cyan-500"
						/>
						<div>
							<p className="text-sm font-medium">Archive this thread</p>
							<p className="text-xs text-[var(--text-secondary)] mt-0.5">
								Keep your {photoCount} image{photoCount !== 1 ? "s" : ""}, thread moves to archived
							</p>
						</div>
					</label>

					<label className="flex items-start gap-3 p-3 rounded border border-red-500/20 hover:border-red-500/40 cursor-pointer transition-colors">
						<input
							type="radio"
							name="deleteOption"
							checked={deletePhotos}
							onChange={() => setDeletePhotos(true)}
							className="mt-0.5 accent-red-500"
						/>
						<div>
							<p className="text-sm font-medium text-red-400">
								Delete thread and all images
							</p>
							<p className="text-xs text-red-400/70 mt-0.5">
								Cannot be undone
							</p>
						</div>
					</label>
				</div>
			</div>
		</Modal>
	);
}
