const ASPECT_RATIOS = [
	{ value: "match_input_image", label: "Match Input" },
	{ value: "1:1", label: "1:1 Square" },
	{ value: "2:3", label: "2:3 Portrait" },
	{ value: "3:2", label: "3:2 Landscape" },
	{ value: "3:4", label: "3:4 Portrait" },
	{ value: "4:3", label: "4:3 Landscape" },
	{ value: "4:5", label: "4:5 Portrait" },
	{ value: "5:4", label: "5:4 Landscape" },
	{ value: "9:16", label: "9:16 Vertical" },
	{ value: "16:9", label: "16:9 Widescreen" },
	{ value: "21:9", label: "21:9 Ultra-wide" },
];

const RESOLUTIONS = [
	{ value: "1K", label: "1K" },
	{ value: "2K", label: "2K" },
	{ value: "4K", label: "4K" },
];

const OUTPUT_FORMATS = [
	{ value: "png", label: "PNG" },
	{ value: "jpg", label: "JPG" },
];

export interface NanoBananaOptions {
	aspectRatio: string;
	resolution: string;
	outputFormat: string;
}

interface NanoBananaOptionsSelectorProps {
	value: NanoBananaOptions;
	onChange: (value: NanoBananaOptions) => void;
	disabled?: boolean;
}

export function NanoBananaOptionsSelector({
	value,
	onChange,
	disabled,
}: NanoBananaOptionsSelectorProps) {
	return (
		<div className="flex items-center gap-2">
			<div className="flex-1">
				<label htmlFor="aspect-ratio" className="sr-only">Aspect Ratio</label>
				<select
					id="aspect-ratio"
					value={value.aspectRatio}
					onChange={(e) => onChange({ ...value, aspectRatio: e.target.value })}
					disabled={disabled}
					title="Aspect Ratio"
					className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
				>
					{ASPECT_RATIOS.map((ratio) => (
						<option key={ratio.value} value={ratio.value}>
							{ratio.label}
						</option>
					))}
				</select>
			</div>

			<div className="w-16">
				<label htmlFor="resolution" className="sr-only">Resolution</label>
				<select
					id="resolution"
					value={value.resolution}
					onChange={(e) => onChange({ ...value, resolution: e.target.value })}
					disabled={disabled}
					title="Resolution"
					className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
				>
					{RESOLUTIONS.map((res) => (
						<option key={res.value} value={res.value}>
							{res.label}
						</option>
					))}
				</select>
			</div>

			<div className="w-20">
				<label htmlFor="output-format" className="sr-only">Format</label>
				<select
					id="output-format"
					value={value.outputFormat}
					onChange={(e) => onChange({ ...value, outputFormat: e.target.value })}
					disabled={disabled}
					title="Format"
					className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
				>
					{OUTPUT_FORMATS.map((fmt) => (
						<option key={fmt.value} value={fmt.value}>
							{fmt.label}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}
