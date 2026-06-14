import { Plus, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { GenerationRules } from "#/lib/mocks/engine";

interface RuleEntry {
	path: string;
	type: "static" | "faker" | "pattern";
	staticValue?: string;
	fakerMethod?: string;
	patternRegex?: string;
}

interface GenerationRulesEditorProps {
	rules: GenerationRules;
	onChange: (rules: GenerationRules) => void;
}

export function GenerationRulesEditor({
	rules,
	onChange,
}: GenerationRulesEditorProps) {
	const entries: RuleEntry[] = rules.fieldOverrides
		? Object.entries(rules.fieldOverrides).map(([path, rule]) => ({
				path,
				type: rule.type,
				staticValue:
					rule.type === "static" ? String(rule.value ?? "") : undefined,
				fakerMethod: rule.type === "faker" ? rule.method : undefined,
				patternRegex: rule.type === "pattern" ? rule.regex : undefined,
			}))
		: [];

	const updateEntries = (newEntries: RuleEntry[]) => {
		const fieldOverrides: GenerationRules["fieldOverrides"] = {};
		for (const entry of newEntries) {
			if (!entry.path) continue;
			switch (entry.type) {
				case "static":
					fieldOverrides[entry.path] = {
						type: "static",
						value: entry.staticValue ?? "",
					};
					break;
				case "faker":
					fieldOverrides[entry.path] = {
						type: "faker",
						method: entry.fakerMethod ?? "person.firstName",
					};
					break;
				case "pattern":
					fieldOverrides[entry.path] = {
						type: "pattern",
						regex: entry.patternRegex ?? ".*",
					};
					break;
			}
		}
		onChange({ ...rules, fieldOverrides });
	};

	const addEntry = () => {
		updateEntries([...entries, { path: "", type: "static", staticValue: "" }]);
	};

	const removeEntry = (index: number) => {
		updateEntries(entries.filter((_, i) => i !== index));
	};

	const updateEntry = (index: number, upd: Partial<RuleEntry>) => {
		updateEntries(entries.map((e, i) => (i === index ? { ...e, ...upd } : e)));
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">Field Overrides</Label>
				<Button variant="outline" size="sm" onClick={addEntry}>
					<Plus className="size-3.5 mr-1" />
					Add Rule
				</Button>
			</div>

			{entries.length === 0 && (
				<p className="text-sm text-muted-foreground">
					No overrides configured. Mock data will be generated from the schema.
				</p>
			)}

			{entries.map((entry, i) => (
				<div key={i} className="flex items-start gap-2 rounded-md border p-3">
					<div className="flex-1 space-y-2">
						<Input
							placeholder="field.path (e.g. user.email)"
							value={entry.path}
							onChange={(e) => updateEntry(i, { path: e.target.value })}
							className="font-mono text-xs"
						/>
						<Select
							value={entry.type}
							onValueChange={(v) =>
								updateEntry(i, {
									type: v as "static" | "faker" | "pattern",
								})
							}
						>
							<SelectTrigger className="h-8">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="static">Static Value</SelectItem>
								<SelectItem value="faker">Faker Method</SelectItem>
								<SelectItem value="pattern">Regex Pattern</SelectItem>
							</SelectContent>
						</Select>
						{entry.type === "static" && (
							<Input
								placeholder='e.g. "hello" or 42'
								value={entry.staticValue ?? ""}
								onChange={(e) =>
									updateEntry(i, { staticValue: e.target.value })
								}
								className="text-xs"
							/>
						)}
						{entry.type === "faker" && (
							<Input
								placeholder="e.g. person.firstName"
								value={entry.fakerMethod ?? ""}
								onChange={(e) =>
									updateEntry(i, { fakerMethod: e.target.value })
								}
								className="font-mono text-xs"
							/>
						)}
						{entry.type === "pattern" && (
							<Input
								placeholder="e.g. ^[a-z]{5}$"
								value={entry.patternRegex ?? ""}
								onChange={(e) =>
									updateEntry(i, { patternRegex: e.target.value })
								}
								className="font-mono text-xs"
							/>
						)}
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => removeEntry(i)}
						className="size-8 shrink-0"
					>
						<Trash2 className="size-3.5" />
					</Button>
				</div>
			))}
		</div>
	);
}
