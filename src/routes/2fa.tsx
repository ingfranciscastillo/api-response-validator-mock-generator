import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/2fa")({
	head: () => ({
		meta: [
			{
				title:
					"Two-Factor Authentication — API Response Validator & Mock Generator",
			},
		],
	}),
	component: TwoFactorPage,
});

function TwoFactorPage() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [totpCode, setTotpCode] = useState("");
	const [backupCode, setBackupCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleVerifyTotp = async () => {
		if (totpCode.length < 6) return;
		setLoading(true);
		setError(null);
		try {
			const { error: verifyError } = await authClient.twoFactor.verifyTotp({
				code: totpCode,
				trustDevice: true,
			});
			if (verifyError) throw new Error(verifyError.message ?? "Invalid code");
			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Verification failed");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyBackupCode = async () => {
		if (!backupCode) return;
		setLoading(true);
		setError(null);
		try {
			const { error: verifyError } =
				await authClient.twoFactor.verifyBackupCode({
					code: backupCode,
					trustDevice: true,
				});
			if (verifyError)
				throw new Error(verifyError.message ?? "Invalid backup code");
			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Verification failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-svh items-center justify-center bg-linear-to-br from-background to-muted p-4">
			<div className="w-full max-w-sm space-y-4">
				<div className="text-center">
					<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-blue/10 mb-3">
						<ShieldAlert className="size-6 text-accent-blue" />
					</div>
					<h1 className="text-xl font-bold">{t("auth:twoFactorTitle")}</h1>
					<p className="text-sm text-text-tertiary mt-1">
						{t("auth:twoFactorSubtitle")}
					</p>
				</div>

				<Tabs defaultValue="totp">
					<TabsList className="w-full">
						<TabsTrigger value="totp" className="flex-1">
							{t("auth:authenticatorApp")}
						</TabsTrigger>
						<TabsTrigger value="backup" className="flex-1">
							{t("auth:backupCodeTab")}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="totp">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">
									{t("auth:authenticatorCodeTitle")}
								</CardTitle>
								<CardDescription>
									{t("auth:authenticatorCodeDescription")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="space-y-1">
									<Label>{t("auth:code")}</Label>
									<Input
										value={totpCode}
										onChange={(e) =>
											setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
										}
										placeholder={t("auth:verificationCodePlaceholder")}
										maxLength={6}
										className="text-center text-lg tracking-widest font-mono"
										autoFocus
									/>
								</div>
								{error && <p className="text-xs text-destructive">{error}</p>}
								<Button
									className="w-full"
									onClick={handleVerifyTotp}
									disabled={loading || totpCode.length < 6}
								>
									{loading ? t("auth:verifying") : t("common:verify")}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="backup">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">
									{t("auth:backupCodeTitle")}
								</CardTitle>
								<CardDescription>
									{t("auth:backupCodeDescription")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="space-y-1">
									<Label>{t("auth:backupCodeTitle")}</Label>
									<Input
										value={backupCode}
										onChange={(e) => setBackupCode(e.target.value)}
										placeholder={t("auth:enterBackupCode")}
									/>
								</div>
								{error && <p className="text-xs text-destructive">{error}</p>}
								<Button
									className="w-full"
									onClick={handleVerifyBackupCode}
									disabled={loading || !backupCode}
								>
									{loading ? t("auth:verifying") : t("common:verify")}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
