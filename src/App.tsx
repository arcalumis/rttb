import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
	type NanoBananaOptions,
	NanoBananaOptionsSelector,
} from "./components/AspectRatioSelector";
import { ChatFeed } from "./components/ChatFeed";
import { GenerationStatus } from "./components/GenerationStatus";
import { IconArchive, IconChat, IconGrid, IconSettings, IconTrash } from "./components/Icons";
import { ImageGallery } from "./components/ImageGallery";
import { ImageUploader } from "./components/ImageUploader";
import { LoginForm } from "./components/LoginForm";
import { MagicLinkVerify } from "./components/MagicLinkVerify";
import { ModelSelector } from "./components/ModelSelector";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { PromptInput, type PromptInputRef } from "./components/PromptInput";
import { SelectedInputsPreview } from "./components/SelectedInputsPreview";
import { UserSettings } from "./components/UserSettings";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useGenerate, useHistory, useModels, useUploads } from "./hooks/useApi";
import { AdminCosts } from "./pages/AdminCosts";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminFinancials } from "./pages/AdminFinancials";
import { AdminLayout } from "./pages/AdminLayout";
import { AdminMetrics } from "./pages/AdminMetrics";
import { AdminPnL } from "./pages/AdminPnL";
import { AdminProducts } from "./pages/AdminProducts";
import { AdminRevenue } from "./pages/AdminRevenue";
import { AdminUsers } from "./pages/AdminUsers";
import { Billing } from "./pages/Billing";
import type { Generation, QueuedGeneration } from "./types";
import "./App.css";

function MainApp() {
	const { user, token, loading: authLoading, logout } = useAuth();
	const [selectedModel, setSelectedModel] = useState("google/nano-banana-pro");
	const [page, setPage] = useState(1);
	const [imageInputs, setImageInputs] = useState<string[]>([]);
	const [showTrash, setShowTrash] = useState(false);
	const [showArchived, setShowArchived] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [nanoBananaOptions, setNanoBananaOptions] = useState<NanoBananaOptions>({
		aspectRatio: "4:3",
		resolution: "1K",
		outputFormat: "png",
	});
	const [viewMode, setViewMode] = useState<"gallery" | "chat">(() =>
		(localStorage.getItem("viewMode") as "gallery" | "chat") || "gallery"
	);
	const [showChatOptions, setShowChatOptions] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);
	const promptInputRef = useRef<PromptInputRef>(null);

	// Generation queue
	const [generationQueue, setGenerationQueue] = useState<QueuedGeneration[]>([]);
	const processingRef = useRef<Set<string>>(new Set());

	const { generate, loading: generating, error: generateError } = useGenerate(token);
	const { models, fetchModels } = useModels();
	const {
		history,
		fetchHistory,
		trashGeneration,
		restoreGeneration,
		archiveGeneration,
		unarchiveGeneration,
		deleteGeneration,
		loading: historyLoading,
	} = useHistory(token);
	const {
		uploads,
		fetchUploads,
		archiveUpload,
		unarchiveUpload,
		deleteUpload,
	} = useUploads(token);

	const selectedModelInfo = models.find((m) => m.id === selectedModel);
	const supportsImageInput = selectedModelInfo?.supportsImageInput || false;

	// Process a single queued generation - must be defined before early returns (Rules of Hooks)
	const processGeneration = useCallback(
		async (queueItem: QueuedGeneration, request: Parameters<typeof generate>[0]) => {
			if (processingRef.current.has(queueItem.id)) return;
			processingRef.current.add(queueItem.id);

			// Get estimated duration from model stats (default 30s if no data)
			const modelInfo = models.find((m) => m.id === queueItem.model);
			const estimatedDuration = modelInfo?.avgGenerationTime || 30;

			// Update status to generating with timing info
			setGenerationQueue((prev) =>
				prev.map((item) =>
					item.id === queueItem.id
						? {
								...item,
								status: "generating",
								startedAt: new Date().toISOString(),
								estimatedDuration,
							}
						: item,
				),
			);

			try {
				const result = await generate(request);

				if (result?.status === "succeeded") {
					// Remove from queue on success
					setGenerationQueue((prev) => prev.filter((item) => item.id !== queueItem.id));
					fetchHistory(1, 20, showTrash, showArchived);
					setPage(1);
				} else {
					// Mark as failed
					setGenerationQueue((prev) =>
						prev.map((item) =>
							item.id === queueItem.id
								? { ...item, status: "failed", error: result?.error || "Generation failed" }
								: item,
						),
					);
				}
			} catch (err) {
				setGenerationQueue((prev) =>
					prev.map((item) =>
						item.id === queueItem.id
							? { ...item, status: "failed", error: String(err) }
							: item,
					),
				);
			} finally {
				processingRef.current.delete(queueItem.id);
			}
		},
		[generate, fetchHistory, showTrash, showArchived, models],
	);

	const handleAddToInputs = useCallback((imageUrl: string) => {
		if (imageInputs.includes(imageUrl)) {
			setImageInputs(prev => prev.filter(url => url !== imageUrl));
		} else if (imageInputs.length < (selectedModelInfo?.maxImages || 14)) {
			setImageInputs(prev => [...prev, imageUrl]);
		}
	}, [imageInputs, selectedModelInfo?.maxImages]);

	useEffect(() => {
		fetchModels();
	}, [fetchModels]);

	useEffect(() => {
		if (token) {
			fetchHistory(1, 20, showTrash, showArchived);
			fetchUploads(showArchived);
		}
	}, [token, fetchHistory, fetchUploads, showTrash, showArchived]);

	// Clear image inputs when switching away from a model that supports them
	useEffect(() => {
		if (!supportsImageInput) {
			setImageInputs([]);
		}
	}, [supportsImageInput]);

	// Persist view mode preference
	useEffect(() => {
		localStorage.setItem("viewMode", viewMode);
	}, [viewMode]);

	// Close user menu on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		};
		if (showUserMenu) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showUserMenu]);

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		);
	}

	if (!user || !token) {
		return <LoginForm />;
	}

	const handleGenerate = async (prompt: string) => {
		const queueId = crypto.randomUUID();
		const request = {
			prompt,
			model: selectedModel,
			imageInputs: supportsImageInput ? imageInputs : undefined,
			aspectRatio: supportsImageInput ? nanoBananaOptions.aspectRatio : undefined,
			resolution: supportsImageInput ? nanoBananaOptions.resolution : undefined,
			outputFormat: supportsImageInput ? nanoBananaOptions.outputFormat : undefined,
		};

		const queueItem: QueuedGeneration = {
			id: queueId,
			prompt,
			model: selectedModel,
			status: "queued",
			createdAt: new Date().toISOString(),
		};

		// Add to queue
		setGenerationQueue((prev) => [queueItem, ...prev]);

		// Clear image inputs immediately so user can start another
		if (supportsImageInput) {
			setImageInputs([]);
		}

		// Start processing immediately
		processGeneration(queueItem, request);
	};

	// Remove failed items from queue
	const dismissQueueItem = (id: string) => {
		setGenerationQueue((prev) => prev.filter((item) => item.id !== id));
	};

	// Chat mode action handlers - generate with image as reference
	const handleGenerateWithImage = async (prompt: string, referenceImageUrl: string) => {
		const queueId = crypto.randomUUID();
		const request = {
			prompt,
			model: "google/nano-banana-pro",
			imageInputs: [referenceImageUrl],
			aspectRatio: nanoBananaOptions.aspectRatio,
			resolution: nanoBananaOptions.resolution,
			outputFormat: nanoBananaOptions.outputFormat,
		};

		const queueItem: QueuedGeneration = {
			id: queueId,
			prompt,
			model: "google/nano-banana-pro",
			status: "queued",
			createdAt: new Date().toISOString(),
		};

		setGenerationQueue((prev) => [queueItem, ...prev]);
		processGeneration(queueItem, request);
	};

	const handleVariations = (gen: Generation) => {
		// Use existing image as reference and regenerate with same prompt
		if (gen.imageUrl) {
			handleGenerateWithImage(gen.prompt, gen.imageUrl);
		} else {
			handleGenerate(gen.prompt);
		}
	};

	const handleUpscale = (gen: Generation) => {
		// Use image as reference with higher resolution setting
		if (gen.imageUrl) {
			const queueId = crypto.randomUUID();
			const request = {
				prompt: gen.prompt,
				model: "google/nano-banana-pro",
				imageInputs: [gen.imageUrl],
				aspectRatio: nanoBananaOptions.aspectRatio,
				resolution: "4K" as const,
				outputFormat: nanoBananaOptions.outputFormat,
			};

			const queueItem: QueuedGeneration = {
				id: queueId,
				prompt: gen.prompt,
				model: "google/nano-banana-pro",
				status: "queued",
				createdAt: new Date().toISOString(),
			};

			setGenerationQueue((prev) => [queueItem, ...prev]);
			processGeneration(queueItem, request);
		} else {
			handleGenerate(gen.prompt);
		}
	};

	const handleRemix = (gen: Generation) => {
		// Add image to inputs and switch to img2img model for user to edit prompt
		if (gen.imageUrl) {
			setImageInputs([gen.imageUrl]);
			setSelectedModel("google/nano-banana-pro");
			setShowChatOptions(true); // Show options so user can modify
			// Focus the prompt input after state updates
			setTimeout(() => promptInputRef.current?.focus(), 0);
		}
	};

	const handleTrash = async (id: string) => {
		const success = await trashGeneration(id);
		if (success) {
			fetchHistory(page, 20, showTrash, showArchived);
		}
	};

	const handleRestore = async (id: string) => {
		const success = await restoreGeneration(id);
		if (success) {
			fetchHistory(page, 20, showTrash, showArchived);
		}
	};

	const handleDelete = async (id: string) => {
		const success = await deleteGeneration(id);
		if (success) {
			fetchHistory(page, 20, showTrash, showArchived);
		}
	};

	const handleArchive = async (id: string) => {
		const success = await archiveGeneration(id);
		if (success) {
			fetchHistory(page, 20, showTrash, showArchived);
		}
	};

	const handleUnarchive = async (id: string) => {
		const success = await unarchiveGeneration(id);
		if (success) {
			fetchHistory(page, 20, showTrash, showArchived);
		}
	};

	const handleArchiveUpload = async (id: string) => {
		const success = await archiveUpload(id);
		if (success) {
			fetchUploads(showArchived);
		}
	};

	const handleUnarchiveUpload = async (id: string) => {
		const success = await unarchiveUpload(id);
		if (success) {
			fetchUploads(showArchived);
		}
	};

	const handleDeleteUpload = async (id: string) => {
		const success = await deleteUpload(id);
		if (success) {
			fetchUploads(showArchived);
		}
	};

	const handleLoadMore = () => {
		const nextPage = page + 1;
		setPage(nextPage);
		fetchHistory(nextPage, 20, showTrash, showArchived);
	};

	const handleToggleTrash = () => {
		setShowTrash(!showTrash);
		setShowArchived(false);
		setPage(1);
	};

	const handleToggleArchived = () => {
		setShowArchived(!showArchived);
		setShowTrash(false);
		setPage(1);
	};

	const hasMore = history ? history.total > history.generations.length : false;

	return (
		<div className="h-screen flex flex-col">
			{/* Fixed Header */}
			<header className="flex-shrink-0 flex items-center justify-between p-3 max-w-[1800px] mx-auto w-full">
				{/* Left: Logo */}
				<div className="flex-1">
					<h1 className="text-xl font-bold gradient-text">tank.yoga</h1>
					<p className="text-cyan-400/60 text-[10px]">neural image synthesis</p>
				</div>

				{/* Center: View Mode Toggle */}
				<div className="flex items-center bg-gray-800 rounded p-0.5">
					<button
						type="button"
						onClick={() => setViewMode("gallery")}
						className={`p-1.5 rounded transition-colors ${
							viewMode === "gallery"
								? "bg-cyan-600 text-white"
								: "text-gray-400 hover:text-white"
						}`}
						title="Gallery view"
					>
						<IconGrid className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() => setViewMode("chat")}
						className={`p-1.5 rounded transition-colors ${
							viewMode === "chat"
								? "bg-cyan-600 text-white"
								: "text-gray-400 hover:text-white"
						}`}
						title="Chat view"
					>
						<IconChat className="w-4 h-4" />
					</button>
				</div>

				{/* Right: User info + dropdown */}
				<div className="flex-1 flex items-center justify-end gap-2">
					{history?.totalCost !== undefined && (
						<div className="text-xs text-gray-500">
							<span className="text-cyan-400">${history.totalCost.toFixed(4)}</span>
						</div>
					)}
					{/* User dropdown */}
					<div className="relative" ref={userMenuRef}>
						<button
							type="button"
							onClick={() => setShowUserMenu(!showUserMenu)}
							className="flex items-center gap-1 px-2 py-1 text-xs cyber-card hover:neon-border rounded transition-all"
						>
							<span className="text-white">{user.username}</span>
							<svg
								className={`w-3 h-3 text-gray-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{showUserMenu && (
							<div className="absolute right-0 top-full mt-1 w-40 cyber-card rounded shadow-lg z-50 py-1 border border-cyan-500/30">
								<button
									type="button"
									onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
									className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-cyan-500/10 transition-colors"
								>
									<IconSettings className="w-4 h-4 text-cyan-400" />
									<span>Settings</span>
								</button>
								<a
									href="/billing"
									className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-cyan-500/10 transition-colors"
								>
									<svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
									</svg>
									<span>Billing</span>
								</a>
								{user.isAdmin && (
									<a
										href="/admin"
										className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-cyan-500/10 transition-colors"
									>
										<svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										<span>Admin</span>
									</a>
								)}
								<button
									type="button"
									onClick={() => { logout(); setShowUserMenu(false); }}
									className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-pink-500/10 transition-colors text-pink-400"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									<span>Logout</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto px-3 pb-3">
				{/* Conditional Layout: Gallery vs Chat */}
				{viewMode === "gallery" ? (
					/* Side-by-side layout */
					<div className="grid lg:grid-cols-[280px,1fr] gap-3 max-w-[1800px] mx-auto">
						{/* Left Panel - Controls */}
						<aside className="space-y-3 lg:sticky lg:top-0 lg:self-start">
							<div className="cyber-card rounded-lg p-3 space-y-3">
								<PromptInput
									ref={promptInputRef}
									onGenerate={handleGenerate}
									loading={generating}
									queueCount={generationQueue.length}
								/>
								<ModelSelector
									models={models}
									selectedModel={selectedModel}
									onSelectModel={setSelectedModel}
								/>
								{supportsImageInput && (
									<>
										<SelectedInputsPreview
											imageUrls={imageInputs}
											onRemove={(url) => setImageInputs(prev => prev.filter(u => u !== url))}
											maxImages={selectedModelInfo?.maxImages || 14}
										/>
										<ImageUploader
											token={token}
											selectedImages={imageInputs}
											onImagesChange={setImageInputs}
											maxImages={selectedModelInfo?.maxImages || 14}
										/>
										<NanoBananaOptionsSelector
											value={nanoBananaOptions}
											onChange={setNanoBananaOptions}
											disabled={generating}
										/>
									</>
								)}
								<GenerationStatus loading={generating} error={generateError} />
							</div>
						</aside>

						{/* Right Panel - Gallery */}
						<main>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<h2 className="text-sm font-medium text-gray-400">
										{showTrash ? "Trash" : showArchived ? "Archived" : "Gallery"}
									</h2>
									{generationQueue.length > 0 && !showTrash && !showArchived && (
										<span className="px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
											{generationQueue.filter((q) => q.status === "generating").length} active
											{generationQueue.filter((q) => q.status === "queued").length > 0 &&
												` + ${generationQueue.filter((q) => q.status === "queued").length}`}
										</span>
									)}
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={handleToggleArchived}
										className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
											showArchived
												? "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50"
												: "cyber-card text-gray-400 hover:text-yellow-400"
										}`}
									>
										<IconArchive className="w-3 h-3" />
										{showArchived ? "Gallery" : "Archived"}
									</button>
									<button
										type="button"
										onClick={handleToggleTrash}
										className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
											showTrash
												? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
												: "cyber-card text-gray-400 hover:text-pink-400"
										}`}
									>
										<IconTrash className="w-3 h-3" />
										{showTrash ? "Gallery" : "Trash"}
									</button>
								</div>
							</div>
							<ImageGallery
								generations={history?.generations || []}
								uploads={!showTrash ? uploads : []}
								queuedItems={generationQueue}
								onTrash={handleTrash}
								onRestore={handleRestore}
								onDelete={handleDelete}
								onArchive={handleArchive}
								onUnarchive={handleUnarchive}
								onArchiveUpload={handleArchiveUpload}
								onUnarchiveUpload={handleUnarchiveUpload}
								onDeleteUpload={handleDeleteUpload}
								onDismissQueueItem={dismissQueueItem}
								onAddToInputs={supportsImageInput ? handleAddToInputs : undefined}
								selectedInputUrls={imageInputs}
								onLoadMore={handleLoadMore}
								hasMore={hasMore}
								loading={historyLoading}
								showTrash={showTrash}
								showArchived={showArchived}
							/>
						</main>
					</div>
				) : (
					/* Chat mode layout */
					<div className="flex flex-col h-full max-w-2xl mx-auto">
					<ChatFeed
						generations={history?.generations || []}
						queuedItems={generationQueue}
						onVariations={handleVariations}
						onUpscale={handleUpscale}
						onRemix={handleRemix}
						onTrash={handleTrash}
						onImageClick={() => {}}
						onLoadMore={handleLoadMore}
						hasMore={hasMore}
						loading={historyLoading}
					/>
					{/* Compact sticky input at bottom */}
					<div className="sticky bottom-0 cyber-card rounded-lg p-2 mt-2 border-t border-cyan-500/20">
						{/* Main prompt row */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowChatOptions(!showChatOptions)}
								className={`p-2 rounded transition-all ${
									showChatOptions ? "bg-cyan-600 text-white" : "cyber-card text-gray-400 hover:text-cyan-400"
								}`}
								title="Model options"
							>
								<IconSettings className="w-4 h-4" />
							</button>
							<div className="flex-1">
								<PromptInput
									ref={promptInputRef}
									onGenerate={handleGenerate}
									loading={generating}
									queueCount={generationQueue.length}
								/>
							</div>
						</div>

						{/* Selected inputs preview (always show if there are inputs) */}
						{imageInputs.length > 0 && (
							<div className="mt-2">
								<SelectedInputsPreview
									imageUrls={imageInputs}
									onRemove={(url) => setImageInputs(prev => prev.filter(u => u !== url))}
									maxImages={selectedModelInfo?.maxImages || 14}
								/>
							</div>
						)}

						{/* Collapsible options panel */}
						{showChatOptions && (
							<div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
								<ModelSelector
									models={models}
									selectedModel={selectedModel}
									onSelectModel={setSelectedModel}
								/>
								{supportsImageInput && (
									<>
										<ImageUploader
											token={token}
											selectedImages={imageInputs}
											onImagesChange={setImageInputs}
											maxImages={selectedModelInfo?.maxImages || 14}
										/>
										<NanoBananaOptionsSelector
											value={nanoBananaOptions}
											onChange={setNanoBananaOptions}
											disabled={generating}
										/>
									</>
								)}
							</div>
						)}
						<GenerationStatus loading={generating} error={generateError} />
					</div>
				</div>
				)}
			</div>

			{/* User Settings Modal */}
			<UserSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
		</div>
	);
}

function AdminRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/" replace />;
	}

	if (!user.isAdmin) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<MainApp />} />
			<Route path="/auth/magic-link" element={<MagicLinkVerify />} />
			<Route path="/auth/reset-password" element={<ResetPasswordPage />} />
			<Route
				path="/billing"
				element={
					<ProtectedRoute>
						<Billing />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin"
				element={
					<AdminRoute>
						<AdminLayout />
					</AdminRoute>
				}
			>
				<Route index element={<AdminDashboard />} />
				<Route path="users" element={<AdminUsers />} />
				<Route path="users/:id" element={<AdminUsers />} />
				<Route path="products" element={<AdminProducts />} />
				<Route path="financials" element={<AdminFinancials />} />
				<Route path="financials/revenue" element={<AdminRevenue />} />
				<Route path="financials/costs" element={<AdminCosts />} />
				<Route path="financials/metrics" element={<AdminMetrics />} />
				<Route path="financials/pnl" element={<AdminPnL />} />
			</Route>
		</Routes>
	);
}

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
