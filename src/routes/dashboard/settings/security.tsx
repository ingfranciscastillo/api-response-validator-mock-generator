import { createFileRoute } from "@tanstack/react-router";
import { Key, Lock, Shield, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { listUserSessions } from "#/lib/auth.functions";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/security")({
	head: () => ({
		meta: [
			{
				title: "Security Settings — API Response Validator & Mock Generator",
			},
		],
	}),
	component: SecurityPage,
});

function SecurityPage() {
	return (
		<div className="flex flex-col gap-4 max-w-lg">
			<ChangePasswordCard />
			<Separator />
			<TwoFactorCard />
			<Separator />
			<ActiveSessionsCard />
			<Separator />
			<LoginHistoryCard />
		</div>
	);
}

function ChangePasswordCard() {
	const { t } = useTranslation();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const handleChangePassword = async () => {
		setError(null);
		if (!currentPassword || !newPassword) {
			setError(t("dashboard:settings.allFieldsRequired"));
			return;
		}
		if (newPassword.length < 8) {
			setError(t("auth:passwordRequirements"));
			return;
		}
		if (newPassword !== confirmPassword) {
			setError(t("dashboard:settings.passwordsDoNotMatch"));
			return;
		}

		setSaving(true);
		try {
			const { error: changeError } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			if (changeError)
				throw new Error(changeError.message ?? t("common:error"));
			setSaved(true);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setTimeout(() => setSaved(false), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : t("common:error"));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Lock className="size-4" />
					{t("dashboard:settings.changePassword")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1.5">
					<Label>{t("dashboard:settings.currentPasswordLabel")}</Label>
					<Input
						type="password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label>{t("dashboard:settings.newPasswordLabel")}</Label>
					<Input
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label>{t("dashboard:settings.confirmNewPasswordLabel")}</Label>
					<Input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
				</div>
				{error && <p className="text-xs text-destructive">{error}</p>}
				<Button onClick={handleChangePassword} disabled={saving}>
					{saved
						? t("common:saved")
						: saving
							? t("common:saving")
							: t("dashboard:settings.updatePassword")}
				</Button>
			</CardContent>
		</Card>
	);
}

function TwoFactorCard() {
	const { t } = useTranslation();
	const { data: session } = authClient.useSession();
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
	const [password, setPassword] = useState("");
	const [totpCode, setTotpCode] = useState("");
	const [setupData, setSetupData] = useState<{
		totpURI: string;
		backupCodes: string[];
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showSetup, setShowSetup] = useState(false);
	const [showDisable, setShowDisable] = useState(false);
	const [showBackupCodes, setShowBackupCodes] = useState(false);
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [operating, setOperating] = useState(false);

	useEffect(() => {
		if (session?.user) {
			setTwoFactorEnabled(
				((session.user as Record<string, unknown>)
					.twoFactorEnabled as boolean) ?? false,
			);
		}
	}, [session]);

	const handleEnable = async () => {
		if (!password) {
			setError(t("dashboard:settings.passwordRequiredFor2FA"));
			return;
		}
		setOperating(true);
		setError(null);
		try {
			const { data, error: enableError } = await authClient.twoFactor.enable({
				password,
			});
			if (enableError)
				throw new Error(enableError.message ?? "Failed to enable 2FA");
			if (data) {
				setSetupData({ totpURI: data.totpURI, backupCodes: data.backupCodes });
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to enable 2FA");
		} finally {
			setOperating(false);
		}
	};

	const handleVerifyTotp = async () => {
		if (!totpCode) return;
		setOperating(true);
		try {
			const { error: verifyError } = await authClient.twoFactor.verifyTotp({
				code: totpCode,
				trustDevice: true,
			});
			if (verifyError)
				throw new Error(verifyError.message ?? "Failed to verify");
			setTwoFactorEnabled(true);
			setShowSetup(false);
			setPassword("");
			setTotpCode("");
			setSetupData(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to verify code");
		} finally {
			setOperating(false);
		}
	};

	const handleDisable = async () => {
		setOperating(true);
		try {
			const { error: disableError } = await authClient.twoFactor.disable({
				password,
			});
			if (disableError)
				throw new Error(disableError.message ?? "Failed to disable 2FA");
			setTwoFactorEnabled(false);
			setShowDisable(false);
			setPassword("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to disable 2FA");
		} finally {
			setOperating(false);
		}
	};

	const handleRegenerateBackupCodes = async () => {
		setOperating(true);
		try {
			const { data, error: regenError } =
				await authClient.twoFactor.generateBackupCodes({
					password,
				});
			if (regenError)
				throw new Error(regenError.message ?? "Failed to regenerate codes");
			if (data) {
				setBackupCodes(data.backupCodes);
				setShowBackupCodes(true);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to regenerate codes",
			);
		} finally {
			setOperating(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Smartphone className="size-4" />
					{t("dashboard:settings.twoFactorAuth")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm">
							{twoFactorEnabled
								? t("dashboard:settings.twoFactorIsEnabled")
								: t("dashboard:settings.twoFactorIsDisabled")}
						</p>
						<p className="text-xs text-text-tertiary mt-0.5">
							{twoFactorEnabled
								? t("dashboard:settings.protectedWithAuthenticator")
								: t("dashboard:settings.twoFactorDescription")}
						</p>
					</div>
					{twoFactorEnabled ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowDisable(true)}
						>
							{t("common:disable")}
						</Button>
					) : (
						<Button size="sm" onClick={() => setShowSetup(true)}>
							{t("common:enable")}
						</Button>
					)}
				</div>

				{twoFactorEnabled && (
					<div className="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setShowBackupCodes(true);
								setPassword("");
							}}
						>
							{t("dashboard:settings.viewBackupCodes")}
						</Button>
					</div>
				)}

				{error && <p className="text-xs text-destructive">{error}</p>}
			</CardContent>

			<Dialog open={showSetup} onOpenChange={setShowSetup}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("dashboard:settings.enableTwoFactorTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("dashboard:settings.enableTwoFactorDescription")}
						</DialogDescription>
					</DialogHeader>

					{!setupData ? (
						<div className="space-y-3">
							<div className="space-y-1">
								<Label>{t("dashboard:settings.confirmPasswordLabel")}</Label>
								<Input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder={t("auth:passwordPlaceholder")}
								/>
							</div>
							{error && <p className="text-xs text-destructive">{error}</p>}
							<Button onClick={handleEnable} disabled={operating || !password}>
								{operating
									? t("dashboard:settings.setupInProgress")
									: t("common:continue")}
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex justify-center">
								<QRCode value={setupData.totpURI} size={200} />
							</div>
							<div className="space-y-1">
								<Label>{t("dashboard:settings.verifyTotpCode")}</Label>
								<Input
									value={totpCode}
									onChange={(e) =>
										setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
									}
									placeholder={t("dashboard:settings.totpPlaceholder")}
									maxLength={6}
									className="text-center text-lg tracking-widest font-mono"
								/>
							</div>
							<div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
								<p className="text-xs font-medium text-amber-800 dark:text-amber-200">
									{t("dashboard:settings.saveBackupCodes")}
								</p>
								<div className="mt-1 grid grid-cols-2 gap-1">
									{setupData.backupCodes.map((code, i) => (
										<code
											key={i}
											className="text-xs font-mono text-amber-700 dark:text-amber-300"
										>
											{code}
										</code>
									))}
								</div>
							</div>
							{error && <p className="text-xs text-destructive">{error}</p>}
							<Button
								onClick={handleVerifyTotp}
								disabled={operating || totpCode.length < 6}
							>
								{operating
									? t("common:verifying")
									: t("dashboard:settings.verifyAndEnable")}
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={showDisable} onOpenChange={setShowDisable}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("dashboard:settings.disableTwoFactorTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("dashboard:settings.disableTwoFactorDescription")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-1">
						<Label>{t("common:password")}</Label>
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={t("auth:passwordPlaceholder")}
						/>
					</div>
					{error && <p className="text-xs text-destructive">{error}</p>}
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDisable(false)}>
							{t("common:cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDisable}
							disabled={operating || !password}
						>
							{operating
								? t("dashboard:settings.disableInProgress")
								: t("dashboard:settings.disableTwoFactor")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("dashboard:settings.backupCodesTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("dashboard:settings.backupCodesDescription")}
						</DialogDescription>
					</DialogHeader>
					{backupCodes.length > 0 ? (
						<div className="grid grid-cols-2 gap-2">
							{backupCodes.map((code, i) => (
								<code
									key={i}
									className="text-sm font-mono bg-muted px-2 py-1 rounded"
								>
									{code}
								</code>
							))}
						</div>
					) : (
						<div className="space-y-1">
							<Label>{t("dashboard:settings.confirmPasswordLabel")}</Label>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder={t("auth:passwordPlaceholder")}
							/>
						</div>
					)}
					{error && <p className="text-xs text-destructive">{error}</p>}
					<DialogFooter>
						{backupCodes.length > 0 ? (
							<Button
								variant="outline"
								onClick={() => setShowBackupCodes(false)}
							>
								{t("common:close")}
							</Button>
						) : (
							<>
								<Button
									variant="outline"
									onClick={() => setShowBackupCodes(false)}
								>
									{t("common:cancel")}
								</Button>
								<Button
									onClick={handleRegenerateBackupCodes}
									disabled={operating || !password}
								>
									{operating
										? t("dashboard:settings.generatingCodes")
										: t("dashboard:settings.generateNewCodes")}
								</Button>
							</>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

function ActiveSessionsCard() {
	const { t } = useTranslation();
	const [sessions, setSessions] = useState<
		{
			id: string;
			createdAt: Date | null;
			userAgent: string | null;
			ipAddress: string | null;
		}[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [revoking, setRevoking] = useState(false);

	const fetchSessions = () => {
		setLoading(true);
		listUserSessions()
			.then(setSessions)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	const handleRevokeAll = async () => {
		setRevoking(true);
		try {
			await authClient.revokeSessions();
			fetchSessions();
		} finally {
			setRevoking(false);
		}
	};

	const formatUserAgent = (ua: string | null) => {
		if (!ua) return t("dashboard:settings.unknownDevice");
		if (ua.includes("Chrome")) return "Chrome";
		if (ua.includes("Firefox")) return "Firefox";
		if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
		if (ua.includes("Edge")) return "Edge";
		if (ua.includes("Mobile")) return "Mobile browser";
		return ua.slice(0, 40);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Shield className="size-4" />
					{t("dashboard:settings.sessions")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{loading ? (
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-2/3" />
					</div>
				) : sessions.length === 0 ? (
					<p className="text-sm text-text-tertiary">
						{t("dashboard:settings.noActiveSessions")}
					</p>
				) : (
					<div className="space-y-2">
						{sessions.map((s) => (
							<div
								key={s.id}
								className="flex items-center justify-between py-1"
							>
								<div className="flex-1 min-w-0">
									<p className="text-sm truncate">
										{formatUserAgent(s.userAgent)}
									</p>
									<p className="text-xs text-text-tertiary">
										{s.ipAddress ?? t("dashboard:settings.unknownIP")} &middot;{" "}
										{s.createdAt
											? new Date(s.createdAt).toLocaleDateString(undefined, {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})
											: t("dashboard:settings.unknownDate")}
									</p>
								</div>
								<Badge variant="outline" className="text-[10px] ml-2 shrink-0">
									{t("dashboard:settings.currentBadge")}
								</Badge>
							</div>
						))}
					</div>
				)}
				<Button
					variant="outline"
					size="sm"
					onClick={handleRevokeAll}
					disabled={revoking || loading || sessions.length === 0}
				>
					{revoking
						? t("dashboard:settings.signingOutSessions")
						: t("dashboard:settings.signOutAllSessions")}
				</Button>
			</CardContent>
		</Card>
	);
}

function LoginHistoryCard() {
	const { t } = useTranslation();
	const [sessions, setSessions] = useState<
		{
			id: string;
			createdAt: Date | null;
			ipAddress: string | null;
			userAgent: string | null;
		}[]
	>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		listUserSessions()
			.then(setSessions)
			.finally(() => setLoading(false));
	}, []);

	const formatDevice = (ua: string | null) => {
		if (!ua) return t("dashboard:settings.unknownDevice");
		const isMobile =
			ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone");
		if (ua.includes("Chrome")) return isMobile ? "Chrome (Mobile)" : "Chrome";
		if (ua.includes("Firefox"))
			return isMobile ? "Firefox (Mobile)" : "Firefox";
		if (ua.includes("Safari") && !ua.includes("Chrome"))
			return isMobile ? "Safari (Mobile)" : "Safari";
		if (ua.includes("Edge")) return "Edge";
		return ua.slice(0, 40);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Key className="size-4" />
					{t("dashboard:settings.recentLoginActivity")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
					</div>
				) : sessions.length === 0 ? (
					<p className="text-sm text-text-tertiary">
						{t("dashboard:settings.noLoginHistory")}
					</p>
				) : (
					<div className="space-y-2">
						{sessions.slice(0, 10).map((s) => (
							<div
								key={s.id}
								className="flex items-center justify-between text-sm"
							>
								<div className="flex-1 min-w-0">
									<p className="truncate">{formatDevice(s.userAgent)}</p>
									<p className="text-xs text-text-tertiary">
										{s.ipAddress ?? t("dashboard:settings.unknownIP")}
									</p>
								</div>
								<span className="text-xs text-text-tertiary shrink-0 ml-2">
									{s.createdAt
										? new Date(s.createdAt).toLocaleDateString(undefined, {
												month: "short",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})
										: ""}
								</span>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
