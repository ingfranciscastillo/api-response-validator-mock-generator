import { chromium } from "@playwright/test";

export async function generatePdfReport(html: string): Promise<Buffer> {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	await page.setContent(html, { waitUntil: "networkidle" });
	const pdf = await page.pdf({
		format: "A4",
		margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
		printBackground: true,
	});
	await browser.close();
	return Buffer.from(pdf);
}
