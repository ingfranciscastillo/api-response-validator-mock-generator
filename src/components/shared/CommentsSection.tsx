"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Textarea } from "#/components/ui/textarea";
import {
	createComment,
	deleteComment,
	listComments,
} from "#/lib/audit/functions";
import { authClient } from "#/lib/auth-client";

interface Comment {
	id: string;
	workspaceId: string;
	authorId: string | null;
	entityType: string;
	entityId: string;
	body: string;
	createdAt: Date;
	updatedAt: Date;
	authorName: string;
	authorImage: string | null;
}

function CommentsSection({
	entityType,
	entityId,
}: {
	entityType: string;
	entityId: string;
}) {
	const { data: session } = authClient.useSession();
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [body, setBody] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const fetchComments = useCallback(async () => {
		setLoading(true);
		setFetchError(null);
		try {
			const res = await listComments({
				data: { entityType, entityId },
			});
			setComments(res);
		} catch (err) {
			setComments([]);
			setFetchError(
				err instanceof Error ? err.message : "Failed to load comments",
			);
		} finally {
			setLoading(false);
		}
	}, [entityType, entityId]);

	useEffect(() => {
		fetchComments();
	}, [fetchComments]);

	const handleSubmit = async () => {
		if (!body.trim()) return;
		setSubmitting(true);
		setSubmitError(null);
		try {
			await createComment({
				data: {
					entityType,
					entityId,
					body: body.trim(),
				},
			});
			setBody("");
			await fetchComments();
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Failed to post comment",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (commentId: string) => {
		setDeleteError(null);
		try {
			await deleteComment({
				data: { commentId },
			});
			await fetchComments();
		} catch (err) {
			setDeleteError(
				err instanceof Error ? err.message : "Failed to delete comment",
			);
		}
	};

	const currentUserId = session?.user?.id;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-sm">
					<MessageSquare className="size-4" />
					Comments ({comments.length})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{loading ? (
					<div className="flex items-center justify-center py-4">
						<div className="size-5 animate-pulse rounded-full bg-muted" />
					</div>
				) : fetchError ? (
					<p className="py-4 text-center text-sm text-red-500">{fetchError}</p>
				) : comments.length === 0 ? (
					<p className="py-4 text-center text-sm text-muted-foreground">
						No comments yet. Be the first to comment.
					</p>
				) : (
					<div className="space-y-3">
						{comments.map((c) => {
							const isAuthor = c.authorId === currentUserId;
							const initial = c.authorName?.charAt(0).toUpperCase() ?? "?";
							return (
								<div
									key={c.id}
									className="flex gap-3 rounded-md border p-3 text-sm"
								>
									<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-blue text-white text-xs font-medium">
										{initial}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="font-medium text-xs">
												{c.authorName}
											</span>
											<span className="text-xs text-muted-foreground">
												{formatRelativeTime(c.createdAt)}
											</span>
											{isAuthor && (
												<button
													type="button"
													onClick={() => handleDelete(c.id)}
													className="ml-auto text-muted-foreground hover:text-error transition-colors"
													title="Delete comment"
												>
													<Trash2 className="size-3" />
												</button>
											)}
										</div>
										<p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
				{submitError && <p className="text-xs text-red-500">{submitError}</p>}
				<div className="flex gap-2 pt-2">
					<Textarea
						placeholder="Write a comment..."
						value={body}
						onChange={(e) => setBody(e.target.value)}
						rows={2}
						className="min-h-[60px] resize-none text-sm"
					/>
					<Button
						size="sm"
						onClick={handleSubmit}
						disabled={!body.trim() || submitting}
						className="shrink-0 self-end"
					>
						{submitting ? "Posting..." : "Comment"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function formatRelativeTime(date: Date): string {
	const now = Date.now();
	const diff = now - new Date(date).getTime();
	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(date).toLocaleDateString();
}

export { CommentsSection };
