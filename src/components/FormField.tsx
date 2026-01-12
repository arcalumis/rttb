import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface BaseFieldProps {
	label: string;
	id: string;
	required?: boolean;
}

interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
	type?: "text" | "email" | "password" | "number";
	multiline?: false;
}

interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
	multiline: true;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps;

export function FormField(props: FormFieldProps) {
	const { label, id, required, multiline, ...rest } = props;

	return (
		<div>
			<label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1">
				{label}{required && " *"}
			</label>
			{multiline ? (
				<textarea
					id={id}
					className="cyber-input w-full px-2 py-1.5 rounded text-sm resize-none"
					required={required}
					{...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
				/>
			) : (
				<input
					id={id}
					className="cyber-input w-full px-2 py-1.5 rounded text-sm"
					required={required}
					{...(rest as InputHTMLAttributes<HTMLInputElement>)}
				/>
			)}
		</div>
	);
}

interface SelectFieldProps extends BaseFieldProps {
	value: string;
	onChange: (value: string) => void;
	options: Array<{ value: string; label: string }>;
	disabled?: boolean;
}

export function SelectField({ label, id, value, onChange, options, disabled, required }: SelectFieldProps) {
	return (
		<div>
			<label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1">
				{label}{required && " *"}
			</label>
			<select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="cyber-input w-full px-2 py-1.5 rounded text-sm disabled:opacity-50"
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}
