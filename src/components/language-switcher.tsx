"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import i18n from "#/lib/i18n/i18n";

export function LanguageSwitcher() {
	const { t } = useTranslation();

	const languages = [
		{ code: "en", label: t("common:language_en") },
		{ code: "es", label: t("common:language_es") },
	];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label={t("common:language")}>
					<Languages className="size-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{languages.map((lang) => (
					<DropdownMenuItem
						key={lang.code}
						onClick={() => i18n.changeLanguage(lang.code)}
					>
						{lang.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
