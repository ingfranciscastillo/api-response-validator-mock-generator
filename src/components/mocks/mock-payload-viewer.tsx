import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { JsonViewer } from "#/components/shared/json-viewer";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { JsonValue } from "#/lib/mocks/engine";

interface MockPayloadViewerProps {
	payload: JsonValue;
	title?: string;
}

export function MockPayloadViewer({ payload, title }: MockPayloadViewerProps) {
	const [copied, setCopied] = useState(false);

	const formatted = JSON.stringify(payload, null, 2);

	const handleCopy = () => {
		navigator.clipboard.writeText(formatted);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				{title && <CardTitle className="text-sm">{title}</CardTitle>}
				<Button
					variant="outline"
					size="sm"
					onClick={handleCopy}
					className="gap-1"
				>
					{copied ? (
						<Check className="size-3.5" />
					) : (
						<Clipboard className="size-3.5" />
					)}
					{copied ? "Copied" : "Copy"}
				</Button>
			</CardHeader>
			<CardContent>
				<JsonViewer data={payload} maxHeight="400px" />
			</CardContent>
		</Card>
	);
}
