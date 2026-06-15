import { createFileRoute } from "@tanstack/react-router";
import { Mail, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	inviteMember,
	listMembers,
	removeMember,
	updateMemberRole,
} from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/team/members")({
	component: MembersPage,
});

function MembersPage() {
	const [members, setMembers] = useState<
		Awaited<ReturnType<typeof listMembers>>
	>([]);
	const [loading, setLoading] = useState(true);
	const [showInvite, setShowInvite] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("member");
	const [inviting, setInviting] = useState(false);

	const fetchMembers = () => {
		setLoading(true);
		listMembers({ data: { organizationId: "" } })
			.then(setMembers)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchMembers();
	}, []);

	const handleInvite = async () => {
		if (!inviteEmail) return;
		setInviting(true);
		try {
			await inviteMember({
				data: {
					organizationId: "",
					email: inviteEmail,
					role: inviteRole,
				},
			});
			setInviteEmail("");
			setShowInvite(false);
		} finally {
			setInviting(false);
		}
	};

	const handleRoleChange = async (memberId: string, role: string) => {
		await updateMemberRole({
			data: { organizationId: "", memberId, role },
		});
		fetchMembers();
	};

	const handleRemove = async (memberId: string) => {
		await removeMember({
			data: { organizationId: "", memberId },
		});
		fetchMembers();
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
									onChange={(e) => setInviteEmail(e.target.value)}
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
					</CardContent>
				</Card>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : members.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-text-tertiary">No team members</p>
				</div>
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
												onClick={() => handleRemove(member.id)}
											>
												<UserMinus className="size-4 text-red-500" />
											</Button>
										</>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
