import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { importSpec } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/new")({
	component: NewSpecPage,
});

function NewSpecPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [importMethod, setImportMethod] = useState<"paste" | "file" | "url">(
		"paste",
	);
	const [pasteContent, setPasteContent] = useState("");
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const text = await file.text();
		setPasteContent(text);
		setImportMethod("paste");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError("Name is required");
			return;
		}

		if (importMethod === "paste" && !pasteContent.trim()) {
			setError("Please paste your specification content");
			return;
		}

		if (importMethod === "url" && !url.trim()) {
			setError("Please enter a specification URL");
			return;
		}

		setLoading(true);
		try {
			await importSpec({
				data: {
					name: name.trim(),
					description: description.trim() || undefined,
					specContent: importMethod === "paste" ? pasteContent : undefined,
					specUrl: importMethod === "url" ? url : undefined,
				},
			});
			navigate({ to: "/dashboard/specs" });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to import specification",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 max-w-2xl">
			<div>
				<h2 className="text-2xl font-bold">Import Specification</h2>
				<p className="text-text-secondary mt-1">
					Import an OpenAPI specification to get started
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<label htmlFor="name" className="text-sm font-medium">
						Name
					</label>
					<Input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="My API"
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label htmlFor="description" className="text-sm font-medium">
						Description (optional)
					</label>
					<Input
						id="description"
						type="text"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="API description"
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium">Import method</label>
					<div className="flex gap-2">
						{(["paste", "file", "url"] as const).map((method) => (
							<Button
								type="button"
								key={method}
								variant={importMethod === method ? "default" : "outline"}
								onClick={() => setImportMethod(method)}
							>
								{method === "paste"
									? "Paste"
									: method === "file"
										? "Upload"
										: "URL"}
							</Button>
						))}
					</div>
				</div>

				{importMethod === "paste" && (
					<div className="flex flex-col gap-2">
						<label htmlFor="spec" className="text-sm font-medium">
							Specification content (JSON or YAML)
						</label>
						<Textarea
							id="spec"
							value={pasteContent}
							onChange={(e) => setPasteContent(e.target.value)}
							className="min-h-[200px] font-mono"
							placeholder='{"openapi": "3.0.0", "info": {...}, "paths": {...}}'
						/>
					</div>
				)}

				{importMethod === "file" && (
					<div className="flex flex-col gap-2">
						<label htmlFor="file" className="text-sm font-medium">
							Upload JSON or YAML file
						</label>
						<Input
							id="file"
							type="file"
							accept=".json,.yaml,.yml"
							onChange={handleFileUpload}
						/>
					</div>
				)}

				{importMethod === "url" && (
					<div className="flex flex-col gap-2">
						<label htmlFor="url" className="text-sm font-medium">
							Specification URL
						</label>
						<Input
							id="url"
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://example.com/openapi.json"
						/>
					</div>
				)}

				{error && (
					<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{error}
					</div>
				)}

				<Button type="submit" disabled={loading}>
					{loading ? "Importing..." : "Import Specification"}
				</Button>
			</form>
		</div>
	);
}
