import crypto from "node:crypto";
import { getDb } from "../db";

export type TokenType = "magic_link" | "password_reset";

interface CreateTokenOptions {
	userId: string;
	type: TokenType;
	rememberMe?: boolean;
	expiresInMinutes: number;
}

interface TokenRecord {
	id: string;
	user_id: string;
	token: string;
	type: string;
	remember_me: number;
	expires_at: string;
	used_at: string | null;
	created_at: string;
}

export interface TokenValidation {
	valid: boolean;
	userId?: string;
	rememberMe?: boolean;
	error?: string;
}

export function generateSecureToken(): string {
	return crypto.randomBytes(32).toString("hex");
}

export function createEmailToken(options: CreateTokenOptions): string {
	const db = getDb();
	const token = generateSecureToken();
	const id = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + options.expiresInMinutes * 60 * 1000);

	db.prepare(`
		INSERT INTO email_tokens (id, user_id, token, type, remember_me, expires_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(
		id,
		options.userId,
		token,
		options.type,
		options.rememberMe ? 1 : 0,
		expiresAt.toISOString(),
	);

	return token;
}

export function validateToken(token: string, expectedType: TokenType): TokenValidation {
	const db = getDb();
	const record = db
		.prepare(`
		SELECT user_id, type, remember_me, expires_at, used_at
		FROM email_tokens
		WHERE token = ?
	`)
		.get(token) as TokenRecord | undefined;

	if (!record) {
		return { valid: false, error: "Invalid token" };
	}

	if (record.type !== expectedType) {
		return { valid: false, error: "Invalid token type" };
	}

	if (record.used_at) {
		return { valid: false, error: "Token already used" };
	}

	if (new Date(record.expires_at) < new Date()) {
		return { valid: false, error: "Token expired" };
	}

	return {
		valid: true,
		userId: record.user_id,
		rememberMe: record.remember_me === 1,
	};
}

export function markTokenUsed(token: string): void {
	const db = getDb();
	db.prepare(`
		UPDATE email_tokens SET used_at = datetime('now') WHERE token = ?
	`).run(token);
}

export function invalidateUserTokens(userId: string, type?: TokenType): void {
	const db = getDb();
	if (type) {
		db.prepare(`
			UPDATE email_tokens
			SET used_at = datetime('now')
			WHERE user_id = ? AND type = ? AND used_at IS NULL
		`).run(userId, type);
	} else {
		db.prepare(`
			UPDATE email_tokens
			SET used_at = datetime('now')
			WHERE user_id = ? AND used_at IS NULL
		`).run(userId);
	}
}

export function cleanupExpiredTokens(): number {
	const db = getDb();
	const result = db
		.prepare(`
		DELETE FROM email_tokens WHERE expires_at < datetime('now')
	`)
		.run();
	return result.changes;
}
