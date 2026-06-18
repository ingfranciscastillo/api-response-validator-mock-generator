import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { importSpec } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/new")({
	head: () => ({
		meta: [
			{
				title: "Add Specification — API Response Validator & Mock Generator",
			},
		],
	}),
	component: NewSpecPage,
});

function NewSpecPage() {
	const { t } = useTranslation();
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
			setError(t("dashboard:specs.import.nameRequired"));
			return;
		}

		if (importMethod === "paste" && !pasteContent.trim()) {
			setError(t("dashboard:specs.import.pasteRequired"));
			return;
		}

		if (importMethod === "url" && !url.trim()) {
			setError(t("dashboard:specs.import.urlRequired"));
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
				err instanceof Error ? err.message : t("dashboard:specs.import.failed"),
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 max-w-2xl">
			<div>
				<h2 className="text-2xl font-bold">
					{t("dashboard:specs.import.title")}
				</h2>
				<p className="text-text-secondary mt-1">
					{t("dashboard:specs.import.description")}
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<label htmlFor="name" className="text-sm font-medium">
						{t("common:name")}
					</label>
					<Input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t("dashboard:specs.import.namePlaceholder")}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label htmlFor="description" className="text-sm font-medium">
						{t("common:description")} ({t("common:optional")})
					</label>
					<Input
						id="description"
						type="text"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t("dashboard:specs.import.descriptionPlaceholder")}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium">
						{t("dashboard:specs.import.importMethod")}
					</label>
					<div className="flex gap-2">
						{(["paste", "file", "url"] as const).map((method) => (
							<Button
								type="button"
								key={method}
								variant={importMethod === method ? "default" : "outline"}
								onClick={() => setImportMethod(method)}
							>
								{method === "paste"
									? t("dashboard:specs.import.methodPaste")
									: method === "file"
										? t("dashboard:specs.import.methodUpload")
										: t("dashboard:specs.import.methodUrl")}
							</Button>
						))}
					</div>
				</div>

				{importMethod === "paste" && (
					<div className="flex flex-col gap-2">
						<label htmlFor="spec" className="text-sm font-medium">
							{t("dashboard:specs.import.contentLabel")}
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
							{t("dashboard:specs.import.fileLabel")}
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
							{t("dashboard:specs.import.urlLabel")}
						</label>
						<Input
							id="url"
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder={t("dashboard:specs.import.urlPlaceholder")}
						/>
					</div>
				)}

				{error && (
					<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{error}
					</div>
				)}

				<Button type="submit" disabled={loading}>
					{loading
						? t("dashboard:specs.import.importing")
						: t("dashboard:specs.import.importButton")}
				</Button>
			</form>
		</div>
	);
}
