"use client";

import { useRouter } from "@tanstack/react-router";
import {
	FileText,
	FlaskConical,
	Loader2,
	Search,
	ShieldCheck,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import { useHotKey } from "#/hooks/use-hot-key";
import { globalSearch } from "#/lib/search/functions";

interface SearchResult {
	id: string;
	type: "specification" | "endpoint" | "mock" | "validation_run";
	label: string;
	subtitle: string | null;
	route: string;
}

const typeIcons: Record<string, typeof FileText> = {
	specification: FileText,
	endpoint: Zap,
	mock: FlaskConical,
	validation_run: ShieldCheck,
};

function CommandPalette() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

	useHotKey("k", () => setOpen((o) => !o));

	useEffect(() => {
		if (!open) {
			setQuery("");
			setResults([]);
		}
	}, [open]);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await globalSearch({
					data: { organizationId: "", query: query.trim() },
				});
				setResults(res);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	const handleSelect = useCallback(
		(route: string) => {
			setOpen(false);
			router.navigate({ to: route as never });
		},
		[router],
	);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput
				placeholder="Search specifications, endpoints, mocks, validation runs..."
				value={query}
				onValueChange={setQuery}
			/>
			<CommandList>
				<CommandEmpty>
					{loading ? (
						<div className="flex items-center justify-center gap-2">
							<Loader2 className="size-4 animate-spin" />
							<span>Searching...</span>
						</div>
					) : query.trim() ? (
						"No results found."
					) : (
						"Type to search..."
					)}
				</CommandEmpty>
				{results.length > 0 && (
					<CommandGroup heading="Results">
						{results.map((result) => {
							const Icon = typeIcons[result.type] ?? Search;
							return (
								<CommandItem
									key={`${result.type}-${result.id}`}
									value={`${result.type}-${result.id}`}
									onSelect={() => handleSelect(result.route)}
								>
									<Icon className="size-4" />
									<div className="flex flex-1 flex-col">
										<span className="text-sm font-medium">{result.label}</span>
										{result.subtitle && (
											<span className="text-xs text-muted-foreground">
												{result.subtitle}
											</span>
										)}
									</div>
									<span className="text-xs capitalize text-muted-foreground">
										{result.type.replace("_", " ")}
									</span>
								</CommandItem>
							);
						})}
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}

export { CommandPalette };
