import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function FieldError({ errors }: { errors: string[] }) {
	if (errors.length === 0) return null;
	return <p className="text-sm text-destructive">{errors.join(", ")}</p>;
}

function ForgotPasswordPage() {
	const { data: session, isPending } = authClient.useSession();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			setServerError(null);
			const { error } = await authClient.forgetPassword({ email: value.email });
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
		<div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background to-muted p-4">
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
							className="flex flex-col gap-4"
						>
							<form.Field
								name="email"
								validators={{
									onChange: ({ value }) =>
										!value
											? "Email is required"
											: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
												? "Invalid email"
												: undefined,
								}}
							>
								{(field) => (
									<div className="flex flex-col gap-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											type="email"
											placeholder="you@example.com"
											autoComplete="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.isTouched && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</div>
								)}
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
