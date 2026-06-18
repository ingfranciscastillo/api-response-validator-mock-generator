"use client";

import { type ReactNode, useEffect, useState } from "react";
import i18n from "./i18n";

interface I18nProviderProps {
	children: ReactNode;
}

function detectBrowserLanguage(): string {
	try {
		const stored = localStorage.getItem("i18nextLng");
		if (stored) return stored;
	} catch {}
	
	const langs = navigator.languages || [navigator.language];
	for (const lang of langs) {
		const base = lang.split("-")[0];
		if (base === "es" || base === "en") return base;
	}
	return "en";
}

export function I18nProvider({ children }: I18nProviderProps) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const lang = detectBrowserLanguage();
		if (lang !== i18n.language) {
			i18n.changeLanguage(lang).then(() => {
				setReady(true);
				try { localStorage.setItem("i18nextLng", lang); } catch {}
			});
		} else {
			setReady(true);
		}
	}, []);

	// Sync lang attribute on HTML tag
	useEffect(() => {
		document.documentElement.lang = i18n.language;
	}, []);

	if (!ready) {
		return <>{children}</>;
	}

	return <>{children}</>;
}
