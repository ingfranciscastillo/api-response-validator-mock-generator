import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Github, ShieldCheck } from "lucide-react";
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
import { Separator } from "#/components/ui/separator";
import { authClient, organization } from "#/lib/auth-client";

const loginSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email"),
	password: z.string().min(1, "Password is required"),
});

export const Route = createFileRoute("/login")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	head: () => ({
		meta: [{ title: "Sign In — API Response Validator & Mock Generator" }],
	}),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();
	const { data: session, isPending } = authClient.useSession();
	const { t } = useTranslation();
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: {
			onChange: loginSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			const { error } = await authClient.signIn.email(value);
			if (error) {
				setServerError(
					error.message ?? error.statusText ?? "Invalid email or password",
				);
				return;
			}
			const { data: orgs } = await organization.list();
			if (!orgs || orgs.length === 0) {
				navigate({ to: "/onboarding" });
				return;
			}
			await organization.setActive({ organizationId: orgs[0].id });
			await authClient.getSession();
			navigate({ to: redirect ?? "/dashboard" });
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
		navigate({ to: redirect ?? "/dashboard" });
		return null;
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-linear-to-br from-background to-muted p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div
						className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-blue text-white"
						aria-hidden="true"
					>
						<ShieldCheck className="size-6" />
					</div>
					<CardTitle className="text-2xl">{t("auth:welcomeBack")}</CardTitle>
					<CardDescription>
						{t("auth:signInToAccountDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<FieldGroup className="gap-4">
							<form.Field name="email">
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
							</form.Field>

							<form.Field name="password">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{t("common:password")}
											</FieldLabel>
											<Input
												id={field.name}
												type="password"
												autoComplete="current-password"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							</form.Field>

							{serverError && (
								<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{serverError}
								</div>
							)}

							<form.Subscribe
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
										{isSubmitting ? t("auth:signingIn") : t("common:signIn")}
									</Button>
								)}
							</form.Subscribe>
						</FieldGroup>
					</form>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<Separator />
					<div className="flex flex-col gap-2 w-full">
						<Button
							variant="outline"
							className="w-full gap-2"
							onClick={() =>
								authClient.signIn.social({
									provider: "github",
									callbackURL: "/dashboard",
								})
							}
						>
							<Github className="size-4" />
							{t("auth:continueWithGitHub")}
						</Button>
						<Button
							variant="outline"
							className="w-full gap-2"
							onClick={() =>
								authClient.signIn.social({
									provider: "google",
									callbackURL: "/dashboard",
								})
							}
						>
							<svg className="size-4" viewBox="0 0 24 24">
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									fill="#EA4335"
								/>
							</svg>
							{t("auth:continueWithGoogle")}
						</Button>
					</div>
					<div className="text-center text-sm text-muted-foreground">
						<Link
							to="/reset-password"
							className="underline-offset-4 underline hover:text-foreground"
						>
							{t("common:forgotPassword")}
						</Link>
					</div>
					<div className="text-center text-sm text-muted-foreground">
						{t("auth:noAccount")}{" "}
						<Link
							to="/register"
							className="underline-offset-4 underline hover:text-foreground"
						>
							{t("common:signUp")}
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
