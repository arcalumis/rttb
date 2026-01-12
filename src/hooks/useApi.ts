import { useCallback, useState } from "react";
import { API_BASE } from "../config";
import type { GenerateRequest, GenerateResponse, HistoryResponse, ModelsResponse } from "../types";

function getAuthHeaders(token: string | null, includeContentType = true): HeadersInit {
	const headers: HeadersInit = {};
	if (includeContentType) {
		headers["Content-Type"] = "application/json";
	}
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

export function useGenerate(token: string | null) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const generate = useCallback(
		async (request: GenerateRequest): Promise<GenerateResponse | null> => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch(`${API_BASE}/api/generate`, {
					method: "POST",
					headers: getAuthHeaders(token),
					body: JSON.stringify(request),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Generation failed");
				}

				return data as GenerateResponse;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Generation failed";
				setError(message);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[token],
	);

	return { generate, loading, error };
}

export function useModels() {
	const [models, setModels] = useState<ModelsResponse["models"]>([]);
	const [loading, setLoading] = useState(false);

	const fetchModels = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/models`);
			const data = (await response.json()) as ModelsResponse;
			setModels(data.models);
		} catch (err) {
			console.error("Failed to fetch models:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	return { models, fetchModels, loading };
}

export function useHistory(token: string | null) {
	const [history, setHistory] = useState<HistoryResponse | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchHistory = useCallback(
		async (page = 1, limit = 20, trash = false, archived = false) => {
			if (!token) return;

			setLoading(true);
			try {
				const response = await fetch(
					`${API_BASE}/api/history?page=${page}&limit=${limit}&trash=${trash}&archived=${archived}`,
					{ headers: getAuthHeaders(token) },
				);
				const data = (await response.json()) as HistoryResponse;
				setHistory(data);
			} catch (err) {
				console.error("Failed to fetch history:", err);
			} finally {
				setLoading(false);
			}
		},
		[token],
	);

	const trashGeneration = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/history/${id}`, {
					method: "PATCH",
					headers: getAuthHeaders(token),
					body: JSON.stringify({ deleted: true }),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to trash generation:", err);
				return false;
			}
		},
		[token],
	);

	const restoreGeneration = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/history/${id}`, {
					method: "PATCH",
					headers: getAuthHeaders(token),
					body: JSON.stringify({ deleted: false }),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to restore generation:", err);
				return false;
			}
		},
		[token],
	);

	const archiveGeneration = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/history/${id}/archive`, {
					method: "PATCH",
					headers: getAuthHeaders(token),
					body: JSON.stringify({ archived: true }),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to archive generation:", err);
				return false;
			}
		},
		[token],
	);

	const unarchiveGeneration = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/history/${id}/archive`, {
					method: "PATCH",
					headers: getAuthHeaders(token),
					body: JSON.stringify({ archived: false }),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to unarchive generation:", err);
				return false;
			}
		},
		[token],
	);

	const deleteGeneration = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/history/${id}`, {
					method: "DELETE",
					headers: getAuthHeaders(token, false),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to delete generation:", err);
				return false;
			}
		},
		[token],
	);

	return { history, fetchHistory, trashGeneration, restoreGeneration, archiveGeneration, unarchiveGeneration, deleteGeneration, loading };
}

export function useUploads(token: string | null) {
	const [uploads, setUploads] = useState<import("../types").Upload[]>([]);
	const [loading, setLoading] = useState(false);

	const fetchUploads = useCallback(
		async (archived = false) => {
			if (!token) return;

			setLoading(true);
			try {
				const response = await fetch(`${API_BASE}/api/uploads?archived=${archived}`, {
					headers: getAuthHeaders(token),
				});
				const data = await response.json();
				setUploads(data.uploads);
			} catch (err) {
				console.error("Failed to fetch uploads:", err);
			} finally {
				setLoading(false);
			}
		},
		[token],
	);

	const archiveUpload = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/uploads/${id}/archive`, {
					method: "PATCH",
					headers: getAuthHeaders(token),
					body: JSON.stringify({ archived: true }),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to archive upload:", err);
				return false;
			}
		},
		[token],
	);

	const unarchiveUpload = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/uploads/${id}/archive`, {
					method: "PATCH",
					headers: getAuthHeaders(token),
					body: JSON.stringify({ archived: false }),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to unarchive upload:", err);
				return false;
			}
		},
		[token],
	);

	const deleteUpload = useCallback(
		async (id: string) => {
			if (!token) return false;
			try {
				const response = await fetch(`${API_BASE}/api/uploads/${id}`, {
					method: "DELETE",
					headers: getAuthHeaders(token, false),
				});
				return response.ok;
			} catch (err) {
				console.error("Failed to delete upload:", err);
				return false;
			}
		},
		[token],
	);

	return { uploads, fetchUploads, archiveUpload, unarchiveUpload, deleteUpload, loading };
}
