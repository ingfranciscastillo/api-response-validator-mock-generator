import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

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

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const { data: session, isPending } = authClient.useSession();

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
					<CardTitle className="text-2xl">Create an account</CardTitle>
					<CardDescription>Enter your details to get started</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.currentTarget);
							const name = formData.get("name") as string;
							const email = formData.get("email") as string;
							const password = formData.get("password") as string;
							void authClient.signUp.email(
								{ email, password, name },
								{
									onSuccess: () => {
										window.location.href = "/dashboard";
									},
								},
							);
						}}
						className="flex flex-col gap-4"
					>
						<div className="flex flex-col gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								type="text"
								placeholder="Your name"
								required
								autoComplete="name"
							/>
						</div>
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
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								required
								autoComplete="new-password"
								minLength={8}
							/>
						</div>
						<Button type="submit" className="w-full">
							Create Account
						</Button>
					</form>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<div className="text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							to="/login"
							className="underline-offset-4 underline hover:text-foreground"
						>
							Sign in
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
