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

function ForgotPasswordPage() {
	const { data: session, isPending } = authClient.useSession();
	const [isSubmitted, setIsSubmitted] = useState(false);

	if (isPending) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (session?.user) {
		window.location.href = "/dashboard";
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
								setIsSubmitted(true);
							}}
							className="flex flex-col gap-4"
						>
							<div className="flex flex-col gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="you@example.com"
									required
									autoComplete="email"
								/>
							</div>
							<Button type="submit" className="w-full">
								Send Reset Link
							</Button>
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
