import Editor, {
	loader,
	type OnChange,
	type OnMount,
} from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useCallback, useRef } from "react";

interface MonacoEditorProps {
	value: string;
	onChange?: (value: string) => void;
	language?: string;
	height?: string;
	readOnly?: boolean;
	minimap?: boolean;
	className?: string;
}

export function MonacoEditor({
	value,
	onChange,
	language = "json",
	height = "300px",
	readOnly = false,
	minimap = false,
	className,
}: MonacoEditorProps) {
	const { theme } = useTheme();
	const editorRef = useRef<Parameters<OnMount>[0]>(null);

	const handleMount: OnMount = useCallback((editor) => {
		editorRef.current = editor;
	}, []);

	const handleChange: OnChange = useCallback(
		(val) => {
			onChange?.(val ?? "");
		},
		[onChange],
	);

	return (
		<div className={className}>
			<Editor
				height={height}
				language={language}
				value={value}
				onChange={handleChange}
				onMount={handleMount}
				theme={theme === "dark" ? "vs-dark" : "vs"}
				options={{
					readOnly,
					minimap: { enabled: minimap },
					fontSize: 13,
					lineNumbers: "on",
					scrollBeyondLastLine: false,
					wordWrap: "on",
					tabSize: 2,
				}}
			/>
		</div>
	);
}
