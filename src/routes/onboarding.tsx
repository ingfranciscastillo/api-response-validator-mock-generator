import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { getSession as getServerSession } from "#/lib/auth.functions";
import { authClient, getSession, organization } from "#/lib/auth-client";

const onboardingSchema = z.object({
	name: z.string().min(1, "Workspace name is required"),
	slug: z
		.string()
		.min(1, "Slug is required")
		.regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
});

function toSlug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export const Route = createFileRoute("/onboarding")({
	beforeLoad: async () => {
		const session = await getServerSession();
		if (session?.session?.activeOrganizationId) {
			throw redirect({ to: "/dashboard" });
		}
	},
	head: () => ({
		meta: [
			{
				title:
					"Set Up Your Workspace — API Response Validator & Mock Generator",
			},
		],
	}),
	component: OnboardingPage,
});

function OnboardingPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const { t } = useTranslation();
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { name: "", slug: "" },
		validators: {
			onChange: onboardingSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			const { data, error } = await organization.create({
				name: value.name,
				slug: value.slug,
			});
			if (error) {
				setServerError(
					error.message ?? error.statusText ?? "Failed to create workspace",
				);
				return;
			}
			if (data) {
				await organization.setActive({ organizationId: data.id });
				await getSession();
			}
			navigate({ to: "/dashboard" });
		},
	});

	if (isPending) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (!session?.user) {
		navigate({ to: "/login" });
		return null;
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-linear-to-br from-background to-muted p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-blue text-white">
						<Building2 className="size-6" />
					</div>
					<CardTitle className="text-2xl">
						{t("auth:onboardingTitle")}
					</CardTitle>
					<CardDescription>
						{t("auth:onboardingFieldDescription")}
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
												{t("auth:workspaceNameLabel")}
											</FieldLabel>
											<Input
												id={field.name}
												placeholder={t("auth:workspaceNamePlaceholder")}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => {
													field.handleChange(e.target.value);
													form.setFieldValue("slug", toSlug(e.target.value));
												}}
												aria-invalid={isInvalid}
												autoFocus
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							</form.Field>

							<form.Field name="slug">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{t("auth:slug")}
											</FieldLabel>
											<Input
												id={field.name}
												placeholder={t("auth:slugPlaceholder")}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(toSlug(e.target.value))
												}
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
											? t("auth:creatingWorkspace")
											: t("auth:createWorkspaceButton")}
									</Button>
								)}
							</form.Subscribe>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
