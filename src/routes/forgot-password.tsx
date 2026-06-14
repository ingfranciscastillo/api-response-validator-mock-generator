import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
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

const forgotPasswordSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email"),
});

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { data: session, isPending } = authClient.useSession();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const form = useForm({
		defaultValues: { email: "" },
		validators: {
			onChange: forgotPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			const { error } = await authClient.requestPasswordReset({
				email: value.email,
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

	return (
		<div className="flex min-h-svh items-center justify-center bg-linear-to-br from-background to-muted p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-blue text-white">
						<ShieldCheck className="size-6" />
					</div>
					<CardTitle className="text-2xl">Reset password</CardTitle>
					<CardDescription>
						Enter your email address and we'll send you a reset link
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isSubmitted ? (
						<div className="flex flex-col gap-4 text-center">
							<p className="text-sm text-muted-foreground">
								Check your email for a reset link. If you don't see it, check
								your spam folder.
							</p>
							<Button asChild>
								<Link to="/login">Back to Sign In</Link>
							</Button>
						</div>
					) : (
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
												<FieldLabel htmlFor={field.name}>Email</FieldLabel>
												<Input
													id={field.name}
													type="email"
													placeholder="you@example.com"
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
											{isSubmitting ? "Sending..." : "Send Reset Link"}
										</Button>
									)}
								</form.Subscribe>
							</FieldGroup>
						</form>
					)}
				</CardContent>
				{!isSubmitted && (
					<CardFooter className="flex flex-col gap-4">
						<div className="text-center text-sm text-muted-foreground">
							Remember your password?{" "}
							<Link
								to="/login"
								className="underline-offset-4 underline hover:text-foreground"
							>
								Sign in
							</Link>
						</div>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
