import { useEffect, useState } from "react";
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import type { GenerationRules } from "#/lib/mocks/engine";
import { generateEndpointMock } from "#/lib/mocks/functions";
import { getEndpoints, getSpec, getSpecs } from "#/lib/specs/functions";
import { GenerationRulesEditor } from "./generation-rules-editor";

interface MockGenerationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onGenerated: () => void;
}

export function MockGenerationModal({
	open,
	onOpenChange,
	onGenerated,
}: MockGenerationModalProps) {
	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);
	const [endpoints, setEndpoints] = useState<
		Awaited<ReturnType<typeof getEndpoints>>
	>([]);
	const [selectedSpecId, setSelectedSpecId] = useState("");
	const [selectedEndpointId, setSelectedEndpointId] = useState("");
	const [statusCode, setStatusCode] = useState("200");
	const [variantType, setVariantType] = useState("generated");
	const [seed, setSeed] = useState("");
	const [rules, setRules] = useState<GenerationRules>({});
	const [generating, setGenerating] = useState(false);

	useEffect(() => {
		if (!open) return;
		getSpecs().then(setSpecs);
	}, [open]);

	useEffect(() => {
		if (!selectedSpecId) {
			setEndpoints([]);
			return;
		}
		getSpec({ data: { specId: selectedSpecId } }).then((spec) => {
			const versionId = spec?.versions?.[0]?.id;
			if (versionId) {
				getEndpoints({ data: { specVersionId: versionId } }).then(setEndpoints);
			}
		});
	}, [selectedSpecId]);

	const handleGenerate = async () => {
		if (!selectedEndpointId) return;
		setGenerating(true);
		try {
			await generateEndpointMock({
				data: {
					specId: selectedSpecId,
					endpointId: selectedEndpointId,
					statusCode: Number(statusCode),
					variantType,
					seed: seed || null,
					rules:
						Object.keys(rules.fieldOverrides ?? {}).length > 0 ? rules : null,
					save: true,
				},
			});
			onGenerated();
			onOpenChange(false);
		} finally {
			setGenerating(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Generate Mock</SheetTitle>
					<SheetDescription>
						Select an endpoint and configure generation options
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Specification</Label>
						<Select value={selectedSpecId} onValueChange={setSelectedSpecId}>
							<SelectTrigger>
								<SelectValue placeholder="Select a spec" />
							</SelectTrigger>
							<SelectContent>
								{specs.map((spec) => (
									<SelectItem key={spec.id} value={spec.id}>
										{spec.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Endpoint</Label>
						<Select
							value={selectedEndpointId}
							onValueChange={setSelectedEndpointId}
							disabled={!selectedSpecId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select an endpoint" />
							</SelectTrigger>
							<SelectContent>
								{endpoints.map((ep) => (
									<SelectItem key={ep.id} value={ep.id}>
										{ep.method} {ep.path}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Status Code</Label>
						<Input
							type="number"
							value={statusCode}
							onChange={(e) => setStatusCode(e.target.value)}
							placeholder="200"
						/>
					</div>

					<div className="space-y-2">
						<Label>Variant Type</Label>
						<Select value={variantType} onValueChange={setVariantType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="generated">Generated</SelectItem>
								<SelectItem value="edge_case_empty">
									Edge Case — Empty
								</SelectItem>
								<SelectItem value="edge_case_nulls">
									Edge Case — Nulls
								</SelectItem>
								<SelectItem value="edge_case_boundary">
									Edge Case — Boundary
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Seed (optional)</Label>
						<Input
							type="number"
							value={seed}
							onChange={(e) => setSeed(e.target.value)}
							placeholder="Random"
						/>
					</div>

					<GenerationRulesEditor rules={rules} onChange={setRules} />
				</div>

				<SheetFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleGenerate}
						disabled={!selectedEndpointId || generating}
					>
						{generating ? "Generating..." : "Generate & Save"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
