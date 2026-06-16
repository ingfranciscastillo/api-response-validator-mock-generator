import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { EmptyState } from "#/components/ui/empty-state";

import { authClient, getSession, organization } from "#/lib/auth-client";
import {
	listPendingInvitationsByEmail,
	rejectInvitation,
} from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/team/invitations")({
	head: () => ({
		meta: [
			{
				title: "Invitations — API Response Validator & Mock Generator",
			},
		],
	}),
	component: InvitationsPage,
});

type Invitation = Awaited<
	ReturnType<typeof listPendingInvitationsByEmail>
>[number];

function InvitationsPage() {
	const navigate = useNavigate();
	const { data: session, isPending: sessionLoading } = authClient.useSession();
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [acceptingId, setAcceptingId] = useState<string | null>(null);
	const [decliningId, setDecliningId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (sessionLoading) return;
		if (!session?.user) {
			navigate({ to: "/login" });
			return;
		}
		listPendingInvitationsByEmail()
			.then(setInvitations)
			.finally(() => setLoading(false));
	}, [session, sessionLoading, navigate]);

	const handleAccept = async (invitation: Invitation) => {
		setAcceptingId(invitation.id);
		setError(null);
		try {
			const { data, error: acceptError } = await organization.acceptInvitation({
				invitationId: invitation.id,
			});
			if (acceptError) {
				throw new Error(acceptError.message ?? "Failed to accept invitation");
			}
			if (data) {
				await organization.setActive({
					organizationId: data.invitation.organizationId,
				});
				await getSession();
			}
			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to accept invitation",
			);
		} finally {
			setAcceptingId(null);
		}
	};

	const handleDecline = async (invitation: Invitation) => {
		setDecliningId(invitation.id);
		setError(null);
		try {
			await rejectInvitation({ data: { invitationId: invitation.id } });
			setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to decline invitation",
			);
		} finally {
			setDecliningId(null);
		}
	};

	if (sessionLoading || loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{error && (
				<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</div>
			)}

			{invitations.length === 0 ? (
				<Card>
					<CardContent className="pt-6">
						<EmptyState
							icon={<Building2 className="size-8" />}
							title="No pending invitations"
							description="You don't have any pending workspace invitations"
						/>
					</CardContent>
				</Card>
			) : (
				invitations.map((inv) => (
					<Card key={inv.id}>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Building2 className="size-4" />
								{inv.organizationName}
							</CardTitle>
							<CardDescription>
								You've been invited to join as{" "}
								<Badge variant="secondary" className="text-xs">
									{inv.role}
								</Badge>
							</CardDescription>
						</CardHeader>
						<CardContent className="flex items-center justify-between">
							<p className="text-xs text-muted-foreground">
								Expires {new Date(inv.expiresAt).toLocaleDateString()}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleDecline(inv)}
									disabled={acceptingId === inv.id || decliningId === inv.id}
								>
									<X className="size-3.5" />
									{decliningId === inv.id ? "Declining..." : "Decline"}
								</Button>
								<Button
									size="sm"
									onClick={() => handleAccept(inv)}
									disabled={acceptingId === inv.id}
									className="gap-1"
								>
									<Check className="size-3.5" />
									{acceptingId === inv.id ? "Accepting..." : "Accept"}
								</Button>
							</div>
						</CardContent>
					</Card>
				))
			)}

			{session?.user && invitations.length === 0 && (
				<div className="text-center">
					<Button variant="outline" asChild>
						<Link to="/onboarding">Create a workspace</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
