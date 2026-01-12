interface GenerationStatusProps {
	loading?: boolean;
	error: string | null;
}

export function GenerationStatus({ error }: GenerationStatusProps) {
	if (!error) return null;

	return (
		<div className="w-full">
			<div className="p-4 bg-red-900/30 rounded-lg border border-red-500/30">
				<p className="text-red-200">{error}</p>
			</div>
		</div>
	);
}
