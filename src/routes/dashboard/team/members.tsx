import { createFileRoute } from "@tanstack/react-router";
import { Mail, UserMinus, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import {
	inviteMember,
	listMembers,
	listMyInvitations,
	removeMember,
	updateMemberRole,
} from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/team/members")({
	head: () => ({
		meta: [
			{
				title: "Team Members — API Response Validator & Mock Generator",
			},
		],
	}),
	component: MembersPage,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function MembersPage() {
	const [members, setMembers] = useState<
		Awaited<ReturnType<typeof listMembers>>
	>([]);
	const [loading, setLoading] = useState(true);
	const [showInvite, setShowInvite] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("member");
	const [inviting, setInviting] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
		{},
	);
	const [actionError, setActionError] = useState<Record<string, string>>({});
	const [pendingInvitations, setPendingInvitations] = useState<
		Awaited<ReturnType<typeof listMyInvitations>>
	>([]);

	const fetchMembers = () => {
		setLoading(true);
		Promise.all([listMembers(), listMyInvitations()])
			.then(([membersData, invitationsData]) => {
				setMembers(membersData);
				setPendingInvitations(invitationsData);
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchMembers();
	}, []);

	const handleInvite = async () => {
		if (!inviteEmail) return;
		setInviteError(null);

		if (!emailRegex.test(inviteEmail)) {
			setInviteError("Please enter a valid email address");
			return;
		}

		setInviting(true);
		try {
			await inviteMember({
				data: {
					email: inviteEmail,
					role: inviteRole,
				},
			});
			setInviteEmail("");
			setShowInvite(false);
			fetchMembers();
		} catch (err) {
			setInviteError(
				err instanceof Error ? err.message : "Failed to invite member",
			);
		} finally {
			setInviting(false);
		}
	};

	const handleRoleChange = async (memberId: string, role: string) => {
		setActionLoading((prev) => ({ ...prev, [memberId]: true }));
		setActionError((prev) => ({ ...prev, [memberId]: "" }));
		try {
			await updateMemberRole({
				data: { memberId, role },
			});
			fetchMembers();
		} catch (err) {
			setActionError((prev) => ({
				...prev,
				[memberId]:
					err instanceof Error ? err.message : "Failed to update role",
			}));
		} finally {
			setActionLoading((prev) => ({ ...prev, [memberId]: false }));
		}
	};

	const handleRemove = async (memberId: string) => {
		setActionLoading((prev) => ({ ...prev, [memberId]: true }));
		setActionError((prev) => ({ ...prev, [memberId]: "" }));
		try {
			await removeMember({
				data: { memberId },
			});
			fetchMembers();
		} catch (err) {
			setActionError((prev) => ({
				...prev,
				[memberId]:
					err instanceof Error ? err.message : "Failed to remove member",
			}));
		} finally {
			setActionLoading((prev) => ({ ...prev, [memberId]: false }));
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-text-secondary">
					{members.length} member{members.length !== 1 ? "s" : ""}
				</p>
				<Button size="sm" onClick={() => setShowInvite(!showInvite)}>
					<UserPlus className="size-4 mr-1" />
					Invite Member
				</Button>
			</div>

			{showInvite && (
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-end gap-3">
							<div className="flex-1 space-y-1">
								<label className="text-xs font-medium">Email</label>
								<Input
									placeholder="colleague@example.com"
									value={inviteEmail}
									onChange={(e) => {
										setInviteEmail(e.target.value);
										setInviteError(null);
									}}
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-medium">Role</label>
								<Select value={inviteRole} onValueChange={setInviteRole}>
									<SelectTrigger className="w-28">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="member">Member</SelectItem>
										<SelectItem value="admin">Admin</SelectItem>
										<SelectItem value="viewer">Viewer</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={handleInvite}
								disabled={!inviteEmail || inviting}
							>
								{inviting ? "Sending..." : "Send Invite"}
							</Button>
						</div>
						{inviteError && (
							<p className="mt-2 text-xs text-destructive">{inviteError}</p>
						)}
					</CardContent>
				</Card>
			)}

			{pendingInvitations.length > 0 && (
				<Card>
					<CardContent className="pt-4">
						<p className="text-sm font-medium mb-2 flex items-center gap-1.5">
							<Mail className="size-4" />
							Pending Invitations ({pendingInvitations.length})
						</p>
						<div className="space-y-1">
							{pendingInvitations.map((inv) => (
								<div
									key={inv.id}
									className="flex items-center justify-between py-1 text-xs"
								>
									<span className="text-muted-foreground">{inv.email}</span>
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-[10px]">
											{inv.role}
										</Badge>
										<span className="text-text-tertiary">
											Expires {new Date(inv.expiresAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="flex items-center gap-3 py-3">
								<Skeleton className="size-8 rounded-full" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : members.length === 0 ? (
				<EmptyState
					icon={<Users className="size-8" />}
					title="No team members"
					description="Invite members to collaborate on your workspace"
				/>
			) : (
				<div className="space-y-2">
					{members.map((member) => (
						<Card key={member.id}>
							<CardContent className="flex items-center justify-between py-3">
								<div className="flex items-center gap-3">
									<Avatar size="sm">
										<AvatarFallback>
											{(member.name ?? member.email).charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">{member.name}</p>
										<p className="text-xs text-text-tertiary flex items-center gap-1">
											<Mail className="size-3" />
											{member.email}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant={
											member.role === "owner"
												? "default"
												: member.role === "admin"
													? "secondary"
													: "outline"
										}
									>
										{member.role}
									</Badge>
									{member.role !== "owner" && (
										<>
											<Select
												value={member.role}
												onValueChange={(v) => handleRoleChange(member.id, v)}
												disabled={actionLoading[member.id]}
											>
												<SelectTrigger className="w-24 h-8 text-xs">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="admin">Admin</SelectItem>
													<SelectItem value="member">Member</SelectItem>
													<SelectItem value="viewer">Viewer</SelectItem>
												</SelectContent>
											</Select>
											<Button
												variant="ghost"
												size="icon-xs"
												aria-label={`Remove ${member.name ?? member.email}`}
												onClick={() => handleRemove(member.id)}
												disabled={actionLoading[member.id]}
											>
												<UserMinus className="size-4 text-red-500" />
											</Button>
										</>
									)}
								</div>
								{actionError[member.id] && (
									<p className="text-xs text-destructive mt-1">
										{actionError[member.id]}
									</p>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
