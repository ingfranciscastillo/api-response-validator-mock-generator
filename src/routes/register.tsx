import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { Separator } from "#/components/ui/separator";
import { authClient } from "#/lib/auth-client";

const registerSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email").min(1, "Email is required"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Must be at least 8 characters"),
});

export const Route = createFileRoute("/register")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{
				title: "Create an Account — API Response Validator & Mock Generator",
			},
		],
	}),
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();
	const { data: session, isPending } = authClient.useSession();
	const { t } = useTranslation();
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		validators: {
			onChange: registerSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			const { error } = await authClient.signUp.email(value);
			if (error) {
				setServerError(
					error.message ?? error.statusText ?? "Registration failed",
				);
				return;
			}
			navigate({ to: "/onboarding" });
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
					<CardTitle className="text-2xl">{t("auth:createAccount")}</CardTitle>
					<CardDescription>
						{t("auth:createAccountDescription")}
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
							<form.Field name="name">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{t("common:name")}
											</FieldLabel>
											<Input
												id={field.name}
												type="text"
												placeholder={t("auth:yourName")}
												autoComplete="name"
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
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
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
												autoComplete="new-password"
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
										{isSubmitting
											? t("auth:creatingAccount")
											: t("auth:createAccount")}
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
							<SiGithub className="size-4" />
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
							<SiGoogle />
							{t("auth:continueWithGoogle")}
						</Button>
					</div>
					<div className="text-center text-sm text-muted-foreground">
						{t("auth:hasAccountSignIn")}{" "}
						<Link
							to="/login"
							className="underline-offset-4 underline hover:text-foreground"
						>
							{t("common:signIn")}
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
