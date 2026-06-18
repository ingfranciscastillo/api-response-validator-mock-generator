import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";

const requestSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email"),
});

const resetSchema = z
	.object({
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const Route = createFileRoute("/reset-password")({
	validateSearch: z.object({
		token: z.string().optional(),
		error: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{
				title: "Reset Password — API Response Validator & Mock Generator",
			},
		],
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { t } = useTranslation();
	const { token, error: urlError } = Route.useSearch();
	const { data: session, isPending } = authClient.useSession();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const isTokenMode = !!token;

	const requestForm = useForm({
		defaultValues: { email: "" },
		validators: { onChange: requestSchema },
		onSubmit: async ({ value }) => {
			setServerError(null);
			const { error } = await authClient.requestPasswordReset({
				email: value.email,
				redirectTo: `${window.location.origin}/reset-password`,
			});
			if (error) {
				setServerError(
					error.message ?? error.statusText ?? "Something went wrong",
				);
				return;
			}
			setIsSubmitted(true);
		},
	});

	const resetForm = useForm({
		defaultValues: { password: "", confirmPassword: "" },
		validators: { onChange: resetSchema },
		onSubmit: async ({ value }) => {
			setServerError(null);
			const { error } = await authClient.resetPassword({
				newPassword: value.password,
				token,
			});
			if (error) {
				setServerError(
					error.message ?? error.statusText ?? "Something went wrong",
				);
				return;
			}
			setIsSubmitted(true);
		},
	});

	if (isPending) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (session?.user) {
		return null;
	}

	if (isTokenMode && isSubmitted) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-linear-to-br from-background to-muted p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-blue text-white">
							<ShieldCheck className="size-6" />
						</div>
						<CardTitle className="text-2xl">
							{t("auth:passwordReset")}
						</CardTitle>
						<CardDescription>{t("auth:passwordResetSuccess")}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full">
							<Link to="/login">{t("auth:signInWithNewPassword")}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!isTokenMode && isSubmitted) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-linear-to-br from-background to-muted p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-blue text-white">
							<ShieldCheck className="size-6" />
						</div>
						<CardTitle className="text-2xl">
							{t("auth:checkYourEmail")}
						</CardTitle>
						<CardDescription>
							{t("auth:resetLinkSentDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full">
							<Link to="/login">{t("auth:backToSignIn")}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-linear-to-br from-background to-muted p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-blue text-white">
						<ShieldCheck className="size-6" />
					</div>
					{isTokenMode ? (
						<>
							<CardTitle className="text-2xl">
								{t("auth:resetPassword")}
							</CardTitle>
							<CardDescription>
								{t("auth:resetPasswordDescription")}
							</CardDescription>
						</>
					) : (
						<>
							<CardTitle className="text-2xl">
								{t("auth:resetPassword")}
							</CardTitle>
							<CardDescription>
								{t("auth:resetPasswordDescription")}
							</CardDescription>
						</>
					)}
				</CardHeader>
				<CardContent>
					{urlError && (
						<div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{urlError === "INVALID_TOKEN"
								? t("auth:invalidTokenError")
								: t("auth:genericError")}
						</div>
					)}

					{serverError && (
						<div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{serverError}
						</div>
					)}

					{isTokenMode ? (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								resetForm.handleSubmit();
							}}
						>
							<FieldGroup className="gap-4">
								<resetForm.Field name="password">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													{t("auth:newPassword")}
												</FieldLabel>
												<Input
													id={field.name}
													type="password"
													autoComplete="new-password"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
												/>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										);
									}}
								</resetForm.Field>

								<resetForm.Field name="confirmPassword">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													{t("common:confirmPassword")}
												</FieldLabel>
												<Input
													id={field.name}
													type="password"
													autoComplete="new-password"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
												/>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										);
									}}
								</resetForm.Field>

								<resetForm.Subscribe
									selector={(state) =>
										[state.canSubmit, state.isSubmitting] as const
									}
								>
									{([canSubmit, isSubmitting]) => (
										<Button
											type="submit"
											disabled={!canSubmit || isSubmitting}
											className="w-full"
										>
											{isSubmitting
												? t("auth:resetting")
												: t("auth:resetPasswordButton")}
										</Button>
									)}
								</resetForm.Subscribe>
							</FieldGroup>
						</form>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								requestForm.handleSubmit();
							}}
						>
							<FieldGroup className="gap-4">
								<requestForm.Field name="email">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													{t("common:email")}
												</FieldLabel>
												<Input
													id={field.name}
													type="email"
													placeholder={t("auth:emailPlaceholder")}
													autoComplete="email"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
												/>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										);
									}}
								</requestForm.Field>

								<requestForm.Subscribe
									selector={(state) =>
										[state.canSubmit, state.isSubmitting] as const
									}
								>
									{([canSubmit, isSubmitting]) => (
										<Button
											type="submit"
											disabled={!canSubmit || isSubmitting}
											className="w-full"
										>
											{isSubmitting
												? t("auth:sending")
												: t("auth:sendResetLink")}
										</Button>
									)}
								</requestForm.Subscribe>
							</FieldGroup>
						</form>
					)}
				</CardContent>
				{!isSubmitted && (
					<CardFooter className="flex flex-col gap-4">
						<div className="text-center text-sm text-muted-foreground">
							{t("auth:rememberPassword")}{" "}
							<Link
								to="/login"
								className="underline-offset-4 underline hover:text-foreground"
							>
								{t("common:signIn")}
							</Link>
						</div>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
