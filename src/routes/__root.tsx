import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "#/components/theme-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const organizationSchema = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "API Response Validator & Mock Generator",
	url: "https://apivalidator.io",
	description:
		"Validate API responses, generate perfect mocks, ship with confidence",
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "API Response Validator & Mock Generator",
			},
			{
				name: "description",
				content:
					"Automatically validate API responses against your OpenAPI specifications, detect breaking changes, and generate realistic mock data.",
			},
			{
				property: "og:title",
				content: "API Response Validator & Mock Generator",
			},
			{
				property: "og:description",
				content:
					"Automatically validate API responses against your OpenAPI specifications, detect breaking changes, and generate realistic mock data.",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:image",
				content: "https://apivalidator.io/og-image.png",
			},
			{
				property: "og:url",
				content: "https://apivalidator.io",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:image",
				content: "https://apivalidator.io/og-image.png",
			},
			{
				httpEquiv: "Content-Security-Policy-Report-Only",
				content:
					"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.apivalidator.io; base-uri 'self'; form-action 'self'",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
				as: "style",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
			},
			{
				rel: "canonical",
				href: "https://apivalidator.io",
			},
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
	}),
	shellComponent: RootDocument,
});

function SkipLink() {
	return (
		<a
			href="#main-content"
			className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none"
		>
			Skip to main content
		</a>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(organizationSchema),
					}}
				/>
			</head>
			<body>
				<SkipLink />
				<div id="main-content">
					<ThemeProvider>{children}</ThemeProvider>
				</div>
				{import.meta.env.DEV && <DynamicDevtools />}
				<Scripts />
			</body>
		</html>
	);
}

function DynamicDevtools() {
	const [devtools, setDevtools] = useState<React.ReactNode>(null);

	useEffect(() => {
		Promise.all([
			import("@tanstack/react-devtools"),
			import("@tanstack/react-router-devtools"),
			import("../integrations/tanstack-query/devtools"),
		]).then(([reactDevtools, routerDevtools, queryDevtools]) => {
			const TD = reactDevtools.TanStackDevtools;
			const RD = routerDevtools.TanStackRouterDevtoolsPanel;
			const QD = queryDevtools.default;
			setDevtools(
				<TD
					config={{ position: "bottom-right" }}
					plugins={[{ name: "Tanstack Router", render: <RD /> }, QD]}
				/>,
			);
		});
	}, []);

	return devtools;
}
