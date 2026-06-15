import { useEffect } from "react";

function useHotKey(key: string, callback: () => void) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
				e.preventDefault();
				callback();
			}
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [key, callback]);
}

export { useHotKey };
