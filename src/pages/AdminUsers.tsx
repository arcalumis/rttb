import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { UsageFrequencyBar } from "../components/UsageFrequencyBar";
import { useAuth } from "../contexts/AuthContext";
import { useAdminProducts, useAdminUsers } from "../hooks/useAdmin";
import type { AdminUser } from "../types";

function formatLastSeen(dateString: string): string {
	const date = new Date(dateString);
	const now = Date.now();
	const diff = now - date.getTime();

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (minutes < 1) return "Now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString();
}

export default function AdminUsers() {
	const { token } = useAuth();
	const { users, total, loading, fetchUsers, updateUser, addCredits, assignSubscription, createUser } =
		useAdminUsers(token);
	const { products, fetchProducts } = useAdminProducts(token);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const [creditAmount, setCreditAmount] = useState("");
	const [creditReason, setCreditReason] = useState("");
	const [selectedProduct, setSelectedProduct] = useState("");

	// Create user modal state
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newUsername, setNewUsername] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
	const [createLoading, setCreateLoading] = useState(false);
	const [createResult, setCreateResult] = useState<{
		success: boolean;
		generatedPassword?: string;
		emailSent?: boolean;
		emailError?: string;
		error?: string;
	} | null>(null);

	useEffect(() => {
		fetchUsers(page, 20, search);
	}, [fetchUsers, page, search]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	const handleSearch = useCallback((e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
	}, []);

	const handleToggleAdmin = async (user: AdminUser) => {
		const success = await updateUser(user.id, { isAdmin: !user.isAdmin });
		if (success) {
			fetchUsers(page, 20, search);
		}
	};

	const handleToggleActive = async (user: AdminUser) => {
		const success = await updateUser(user.id, { isActive: !user.isActive });
		if (success) {
			fetchUsers(page, 20, search);
		}
	};

	const handleAddCredits = async () => {
		if (!selectedUser || !creditAmount) return;
		const amount = Number.parseInt(creditAmount, 10);
		if (Number.isNaN(amount)) return;

		const result = await addCredits(selectedUser.id, amount, creditReason);
		if (result.success) {
			setCreditAmount("");
			setCreditReason("");
			setSelectedUser(null);
			fetchUsers(page, 20, search);
		}
	};

	const handleAssignSubscription = async () => {
		if (!selectedUser || !selectedProduct) return;

		const success = await assignSubscription(selectedUser.id, selectedProduct);
		if (success) {
			setSelectedProduct("");
			setSelectedUser(null);
			fetchUsers(page, 20, search);
		}
	};

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newUsername || !newEmail) return;

		setCreateLoading(true);
		setCreateResult(null);

		const result = await createUser({
			username: newUsername,
			email: newEmail,
			password: newPassword || undefined,
			sendEmail: sendWelcomeEmail,
		});

		setCreateLoading(false);

		if (result.success && result.user) {
			setCreateResult({
				success: true,
				generatedPassword: result.user.generatedPassword,
				emailSent: result.user.emailSent,
				emailError: result.user.emailError,
			});
			fetchUsers(page, 20, search);
		} else {
			setCreateResult({ success: false, error: result.error });
		}
	};

	const resetCreateModal = () => {
		setShowCreateModal(false);
		setNewUsername("");
		setNewEmail("");
		setNewPassword("");
		setSendWelcomeEmail(true);
		setCreateResult(null);
	};

	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold gradient-text">Users</h1>
				<div className="text-xs text-gray-400">{total} total</div>
			</div>

			{/* Search and Create */}
			<form onSubmit={handleSearch} className="mb-3">
				<div className="flex gap-2">
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by username or email..."
						className="cyber-input flex-1 px-3 py-1.5 rounded text-sm focus:outline-none"
					/>
					<button type="submit" className="cyber-button px-3 py-1.5 rounded text-sm">Search</button>
					<button
						type="button"
						onClick={() => setShowCreateModal(true)}
						className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-sm transition-colors"
					>
						+ Create
					</button>
				</div>
			</form>

			{/* Users table */}
			<div className="cyber-card rounded overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-cyan-500/20">
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">User</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Email</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Sub</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Month</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Credits</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Last Seen</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Status</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading && users.length === 0 ? (
							<tr>
								<td colSpan={8} className="px-3 py-6 text-center text-gray-400 text-xs">Loading...</td>
							</tr>
						) : users.length === 0 ? (
							<tr>
								<td colSpan={8} className="px-3 py-6 text-center text-gray-400 text-xs">No users found</td>
							</tr>
						) : (
							users.map((user) => (
								<tr key={user.id} className="border-b border-cyan-500/10 last:border-0 hover:bg-cyan-500/5">
									<td className="px-3 py-2">
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-semibold">
												{user.username.charAt(0).toUpperCase()}
											</div>
											<div className="flex flex-col gap-0.5">
												<Link to={`/admin/users/${user.id}`} className="text-sm font-medium hover:text-cyan-400">{user.username}</Link>
												{user.dailyUsageHistory && <UsageFrequencyBar data={user.dailyUsageHistory} />}
											</div>
										</div>
									</td>
									<td className="px-3 py-2">
										{user.email ? (
											<span className="text-xs text-gray-300">{user.email}</span>
										) : (
											<span className="text-gray-500 text-xs">-</span>
										)}
									</td>
									<td className="px-3 py-2">
										{user.subscription ? (
											<span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">{user.subscription.productName}</span>
										) : (
											<span className="text-gray-500 text-xs">-</span>
										)}
									</td>
									<td className="px-3 py-2">
										<div className="text-xs">
											<span className="text-white">{user.currentMonth.imageCount}</span>
											<span className="text-gray-500 ml-1">${user.currentMonth.totalCost.toFixed(2)}</span>
										</div>
									</td>
									<td className="px-3 py-2">
										<span className={user.credits > 0 ? "text-cyan-400" : "text-gray-500"}>{user.credits}</span>
									</td>
									<td className="px-3 py-2">
										{user.lastLogin ? (
											<span className={`text-xs ${
												Date.now() - new Date(user.lastLogin).getTime() < 15 * 60 * 1000
													? "text-green-400"
													: Date.now() - new Date(user.lastLogin).getTime() < 24 * 60 * 60 * 1000
														? "text-cyan-400"
														: "text-gray-400"
											}`}>
												{formatLastSeen(user.lastLogin)}
											</span>
										) : (
											<span className="text-gray-500 text-xs">Never</span>
										)}
									</td>
									<td className="px-3 py-2">
										<div className="flex gap-1">
											{user.isAdmin && <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px]">Admin</span>}
											{!user.isActive && <span className="px-1 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">Off</span>}
										</div>
									</td>
									<td className="px-3 py-2">
										<button
											type="button"
											onClick={() => setSelectedUser(user)}
											className="px-2 py-0.5 cyber-card hover:neon-border rounded text-xs transition-all"
										>
											Manage
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{total > 20 && (
				<div className="flex justify-center gap-2 mt-3">
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
						className="px-2 py-1 cyber-card hover:neon-border disabled:opacity-50 rounded text-xs transition-all"
					>
						Prev
					</button>
					<span className="px-2 py-1 text-gray-400 text-xs">
						{page} / {Math.ceil(total / 20)}
					</span>
					<button
						type="button"
						onClick={() => setPage((p) => p + 1)}
						disabled={page >= Math.ceil(total / 20)}
						className="px-2 py-1 cyber-card hover:neon-border disabled:opacity-50 rounded text-xs transition-all"
					>
						Next
					</button>
				</div>
			)}

			{/* User management modal */}
			<Modal
				isOpen={!!selectedUser}
				onClose={() => setSelectedUser(null)}
				title={`Manage ${selectedUser?.username || ""}`}
				size="sm"
			>
				{selectedUser && (
					<div className="space-y-4">
							{/* User info */}
							{selectedUser.email && (
								<div className="text-sm text-gray-300">
									<span className="text-gray-500">Email:</span> {selectedUser.email}
								</div>
							)}

							{/* Quick actions */}
							<div className="space-y-1.5">
								<h3 className="text-xs font-medium text-gray-400">Quick Actions</h3>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => handleToggleAdmin(selectedUser)}
										className={`px-2 py-1 rounded text-xs transition-colors ${selectedUser.isAdmin ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" : "cyber-card hover:neon-border"}`}
									>
										{selectedUser.isAdmin ? "- Admin" : "+ Admin"}
									</button>
									<button
										type="button"
										onClick={() => handleToggleActive(selectedUser)}
										className={`px-2 py-1 rounded text-xs transition-colors ${selectedUser.isActive ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"}`}
									>
										{selectedUser.isActive ? "Disable" : "Enable"}
									</button>
								</div>
							</div>

							{/* Add credits */}
							<div className="space-y-1.5">
								<h3 className="text-xs font-medium text-gray-400">Add Credits ({selectedUser.credits})</h3>
								<div className="flex gap-1.5">
									<input
										type="number"
										value={creditAmount}
										onChange={(e) => setCreditAmount(e.target.value)}
										placeholder="Amt"
										className="cyber-input w-16 px-2 py-1 rounded text-xs"
									/>
									<input
										type="text"
										value={creditReason}
										onChange={(e) => setCreditReason(e.target.value)}
										placeholder="Reason"
										className="cyber-input flex-1 px-2 py-1 rounded text-xs"
									/>
									<button
										type="button"
										onClick={handleAddCredits}
										disabled={!creditAmount}
										className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded text-xs transition-colors"
									>
										Add
									</button>
								</div>
							</div>

							{/* Assign subscription */}
							<div className="space-y-1.5">
								<h3 className="text-xs font-medium text-gray-400">Subscription ({selectedUser.subscription?.productName || "None"})</h3>
								<div className="flex gap-1.5">
									<select
										value={selectedProduct}
										onChange={(e) => setSelectedProduct(e.target.value)}
										className="cyber-input flex-1 px-2 py-1 rounded text-xs"
									>
										<option value="">Select...</option>
										{products.map((product) => (
											<option key={product.id} value={product.id}>
												{product.name} {product.price > 0 ? `($${product.price})` : "(Free)"}
											</option>
										))}
									</select>
									<button
										type="button"
										onClick={handleAssignSubscription}
										disabled={!selectedProduct}
										className="cyber-button px-2 py-1 disabled:opacity-50 rounded text-xs"
									>
										Set
									</button>
								</div>
							</div>
						</div>
					)}
			</Modal>

			{/* Create user modal */}
			<Modal isOpen={showCreateModal} onClose={resetCreateModal} title="Create User" size="sm">
				{createResult?.success ? (
					<div className="space-y-3">
						<div className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded">
							<p className="text-cyan-400 text-sm">User created!</p>
						</div>

						{createResult.generatedPassword && (
							<div className="p-2 cyber-card rounded">
								<p className="text-[10px] text-gray-400 mb-1">Generated password:</p>
								<code className="text-sm font-mono text-pink-400">{createResult.generatedPassword}</code>
								<p className="text-[10px] text-gray-500 mt-1">Save this - won't show again.</p>
							</div>
						)}

						{createResult.emailSent ? (
							<p className="text-xs text-cyan-400">Email sent.</p>
						) : createResult.emailError ? (
							<p className="text-xs text-yellow-400">Email failed: {createResult.emailError}</p>
						) : null}

						<Button variant="primary" onClick={resetCreateModal} className="w-full">Done</Button>
					</div>
				) : (
					<form onSubmit={handleCreateUser} className="space-y-3">
						{createResult?.error && (
							<div className="p-2 bg-red-500/20 border border-red-500/40 rounded">
								<p className="text-red-400 text-xs">{createResult.error}</p>
							</div>
						)}

						<div>
							<label className="block text-xs font-medium text-gray-400 mb-1">Username *</label>
							<input
								type="text"
								value={newUsername}
								onChange={(e) => setNewUsername(e.target.value)}
								required
								className="cyber-input w-full px-2 py-1.5 rounded text-sm"
								placeholder="johndoe"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-400 mb-1">Email *</label>
							<input
								type="email"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								required
								className="cyber-input w-full px-2 py-1.5 rounded text-sm"
								placeholder="john@example.com"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
							<input
								type="text"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="cyber-input w-full px-2 py-1.5 rounded text-sm"
								placeholder="Leave blank to auto-generate"
							/>
						</div>

						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="sendEmail"
								checked={sendWelcomeEmail}
								onChange={(e) => setSendWelcomeEmail(e.target.checked)}
								className="w-3 h-3 rounded border-cyan-500/30 bg-gray-800 text-cyan-600"
							/>
							<label htmlFor="sendEmail" className="text-xs text-gray-300">Send welcome email</label>
						</div>

						<div className="flex gap-2">
							<Button variant="secondary" onClick={resetCreateModal} className="flex-1">Cancel</Button>
							<Button
								variant="success"
								type="submit"
								disabled={createLoading || !newUsername || !newEmail}
								className="flex-1"
							>
								{createLoading ? "..." : "Create"}
							</Button>
						</div>
					</form>
				)}
			</Modal>
		</div>
	);
}
