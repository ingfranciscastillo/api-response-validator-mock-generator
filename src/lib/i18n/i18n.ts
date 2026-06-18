import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

export const defaultNS = "common";

export const resources = {
	en: { ...en },
	es: { ...es },
} as const;

void i18n.use(initReactI18next).init({
	resources,
	fallbackLng: "en",
	defaultNS,
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
