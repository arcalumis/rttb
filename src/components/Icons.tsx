interface IconProps {
	className?: string;
}

export function IconClose({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Close">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
		</svg>
	);
}

export function IconTrash({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Trash">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
		</svg>
	);
}

export function IconPlus({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Add">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
		</svg>
	);
}

export function IconCheck({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="currentColor" viewBox="0 0 24 24" role="img" aria-label="Check">
			<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
		</svg>
	);
}

export function IconSpinner({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={`animate-spin ${className}`} viewBox="0 0 24 24" role="img" aria-label="Loading">
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
			<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
		</svg>
	);
}

export function IconSettings({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Settings">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
		</svg>
	);
}

export function IconRestore({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Restore">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
		</svg>
	);
}

export function IconChevron({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Navigate">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
		</svg>
	);
}

export function IconUsers({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Users">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
		</svg>
	);
}

export function IconProducts({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Products">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
		</svg>
	);
}

export function IconDashboard({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Dashboard">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
		</svg>
	);
}

export function IconLogout({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Sign out">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
		</svg>
	);
}

export function IconImage({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Image">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
	);
}

export function IconGrid({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Grid view">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
		</svg>
	);
}

export function IconChat({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Chat view">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
		</svg>
	);
}

export function IconVariations({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Variations">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
		</svg>
	);
}

export function IconUpscale({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Upscale">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
		</svg>
	);
}

export function IconRemix({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Remix">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>
	);
}

export function IconDownload({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Download">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
		</svg>
	);
}

export function IconZoom({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Zoom">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
		</svg>
	);
}

export function IconRotate({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Rotate">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
		</svg>
	);
}

export function IconArchive({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Archive">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
		</svg>
	);
}

export function IconUnarchive({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Unarchive">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4l2-2m0 0l2 2m-2-2v4" />
		</svg>
	);
}

export function IconUpload({ className = "w-4 h-4" }: IconProps) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Upload">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
		</svg>
	);
}
