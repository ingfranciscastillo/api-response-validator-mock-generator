import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

let globalQueryClient: QueryClient | undefined;

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
		},
	});
}

export function getContext() {
	globalQueryClient = makeQueryClient();
	return {
		queryClient: globalQueryClient,
	};
}

export default function TanstackQueryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [queryClient] = useState(() => globalQueryClient ?? makeQueryClient());

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
