import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment or use a default (change in production!)
function getEncryptionKey(): Buffer {
	const key = process.env.API_KEY_SECRET || "change-this-in-production-32ch";
	// Ensure key is exactly 32 bytes for AES-256
	return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a string value (e.g., API key)
 * Returns base64-encoded string containing: IV + AuthTag + EncryptedData
 */
export function encrypt(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(IV_LENGTH);

	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	let encrypted = cipher.update(plaintext, "utf8");
	encrypted = Buffer.concat([encrypted, cipher.final()]);

	const authTag = cipher.getAuthTag();

	// Combine IV + AuthTag + EncryptedData
	const combined = Buffer.concat([iv, authTag, encrypted]);
	return combined.toString("base64");
}

/**
 * Decrypt a string value
 * Expects base64-encoded string containing: IV + AuthTag + EncryptedData
 */
export function decrypt(encryptedData: string): string {
	const key = getEncryptionKey();
	const combined = Buffer.from(encryptedData, "base64");

	// Extract components
	const iv = combined.subarray(0, IV_LENGTH);
	const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encrypted);
	decrypted = Buffer.concat([decrypted, decipher.final()]);

	return decrypted.toString("utf8");
}

/**
 * Mask an API key for display (show only last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
	if (apiKey.length <= 4) {
		return "****";
	}
	return `${"*".repeat(apiKey.length - 4)}${apiKey.slice(-4)}`;
}

/**
 * Validate that an API key looks like a valid Replicate API key
 */
export function isValidReplicateKeyFormat(apiKey: string): boolean {
	// Replicate keys start with 'r8_' and are 40+ characters
	return apiKey.startsWith("r8_") && apiKey.length >= 40;
}
