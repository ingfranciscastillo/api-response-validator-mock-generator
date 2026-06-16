import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

function getClient(): S3Client {
	if (!client) {
		client = new S3Client({
			region: "auto",
			endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: process.env.R2_ACCESS_KEY_ID!,
				secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
			},
		});
	}
	return client;
}

export function isR2Configured(): boolean {
	return !!(
		process.env.R2_ACCOUNT_ID &&
		process.env.R2_ACCESS_KEY_ID &&
		process.env.R2_SECRET_ACCESS_KEY &&
		process.env.R2_BUCKET_NAME
	);
}

export async function uploadToR2(
	key: string,
	body: Buffer | string,
	contentType?: string,
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME!,
		Key: key,
		Body: body,
		ContentType: contentType,
	});
	await getClient().send(command);
	return key;
}

export async function downloadFromR2(key: string): Promise<Buffer> {
	const command = new GetObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME!,
		Key: key,
	});
	const response = await getClient().send(command);
	return Buffer.from(await response.Body!.transformToByteArray());
}

export async function deleteFromR2(key: string): Promise<void> {
	const command = new DeleteObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME!,
		Key: key,
	});
	await getClient().send(command);
}

export async function getSignedR2Url(
	key: string,
	expiresIn = 3600,
): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME!,
		Key: key,
	});
	return getSignedUrl(getClient(), command, { expiresIn });
}

export function buildStorageKey(
	workspaceId: string,
	domain: string,
	entityId: string,
	filename: string,
): string {
	return `workspaces/${workspaceId}/${domain}/${entityId}/${filename}`;
}
