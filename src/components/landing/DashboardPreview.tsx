import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, CheckCircle, FileText, Zap } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

gsap.registerPlugin(ScrollTrigger);

export function DashboardPreview() {
	const sectionRef = useRef<HTMLElement>(null);
	const { t } = useTranslation();

	const recentRuns = [
		{
			name: "Petstore API",
			outcomeKey: "Pass",
			checks: "24/24",
			date: "2m ago",
		},
		{
			name: "Payment Gateway",
			outcomeKey: "Fail",
			checks: "18/24",
			date: "15m ago",
		},
		{
			name: "User Service",
			outcomeKey: "Warning",
			checks: "22/24",
			date: "1h ago",
		},
	];

	const barHeights = [48, 64, 32, 72, 56, 44, 60];

	const stats = [
		{
			icon: FileText,
			label: t("landing:dashboardPreview.apisMonitored"),
			value: "12",
		},
		{
			icon: CheckCircle,
			label: t("landing:dashboardPreview.successRate"),
			value: "94.2%",
		},
		{
			icon: Activity,
			label: t("landing:dashboardPreview.violations"),
			value: "8",
		},
		{
			icon: Zap,
			label: t("landing:dashboardPreview.stats.mocksGenerated"),
			value: "1,247",
		},
	];

	useGSAP(
		() => {
			gsap.fromTo(
				".dashboard-stats > *",
				{ y: 30, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					duration: 0.5,
					stagger: 0.1,
					ease: "power2.out",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top 75%",
						toggleActions: "play none none none",
					},
				},
			);

			gsap.fromTo(
				".dashboard-bar",
				{ height: 0, opacity: 0 },
				{
					height: (i) => barHeights[i],
					opacity: 1,
					duration: 0.6,
					stagger: 0.08,
					ease: "back.out(1.4)",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top 70%",
						toggleActions: "play none none none",
					},
				},
			);

			gsap.fromTo(
				".dashboard-row",
				{ x: -20, opacity: 0 },
				{
					x: 0,
					opacity: 1,
					duration: 0.4,
					stagger: 0.08,
					ease: "power2.out",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top 65%",
						toggleActions: "play none none none",
					},
				},
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="px-4 py-24" id="demo-preview">
			<div className="mx-auto max-w-5xl text-center">
				<h2 className="text-display-sm font-bold text-text-primary">
					{t("landing:dashboardPreview.heading")}
				</h2>
				<p className="mt-4 mb-12 text-lg text-text-secondary">
					{t("landing:dashboardPreview.subtitle")}
				</p>
				<div className="glass-panel overflow-hidden text-left">
					<div className="border-b border-border px-6 py-4">
						<div className="flex items-center gap-2">
							<div className="size-3 rounded-full bg-error" />
							<div className="size-3 rounded-full bg-warning" />
							<div className="size-3 rounded-full bg-success" />
							<span className="ml-2 text-sm text-text-tertiary">
								{t("landing:dashboardPreview.dashboardOverview")}
							</span>
						</div>
					</div>
					<div className="p-6">
						<div className="dashboard-stats mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{stats.map((stat) => (
								<div
									key={stat.label}
									className="rounded-lg border border-border bg-surface p-4"
								>
									<div className="mb-2 flex items-center gap-2 text-text-tertiary">
										<stat.icon className="size-4" />
										<span className="text-xs">{stat.label}</span>
									</div>
									<div className="text-2xl font-bold text-text-primary">
										{stat.value}
									</div>
								</div>
							))}
						</div>
						<div className="mb-6">
							<div className="flex items-end gap-2">
								{barHeights.map((_, i) => (
									<div
										key={i}
										className="dashboard-bar flex-1 rounded-t bg-accent-blue/20"
									/>
								))}
							</div>
						</div>
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-left text-text-tertiary">
									<th className="pb-2 font-medium">
										{t("landing:dashboardPreview.runLabel")}
									</th>
									<th className="pb-2 font-medium">
										{t("landing:dashboardPreview.outcomeLabel")}
									</th>
									<th className="pb-2 font-medium">
										{t("landing:dashboardPreview.checksLabel")}
									</th>
									<th className="pb-2 font-medium">
										{t("landing:dashboardPreview.dateLabel")}
									</th>
								</tr>
							</thead>
							<tbody>
								{recentRuns.map((run) => (
									<tr
										key={run.name}
										className="dashboard-row border-b border-border/50"
									>
										<td className="py-3 text-text-primary">{run.name}</td>
										<td className="py-3">
											<span
												className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
													run.outcomeKey === "Pass"
														? "bg-success/10 text-success"
														: run.outcomeKey === "Fail"
															? "bg-error/10 text-error"
															: "bg-warning/10 text-warning"
												}`}
											>
												{run.outcomeKey === "Pass"
													? t("landing:dashboardPreview.pass")
													: run.outcomeKey === "Fail"
														? t("landing:dashboardPreview.fail")
														: t("landing:dashboardPreview.warningLabel")}
											</span>
										</td>
										<td className="py-3 text-text-secondary">{run.checks}</td>
										<td className="py-3 text-text-tertiary">{run.date}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</section>
	);
}
