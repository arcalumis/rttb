import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAdminStats } from "../hooks/useAdmin";

export default function AdminDashboard() {
	const { token } = useAuth();
	const { stats, loading, fetchStats } = useAdminStats(token);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	if (loading && !stats) {
		return (
			<div className="p-4">
				<div className="text-gray-400 text-sm">Loading...</div>
			</div>
		);
	}

	return (
		<div className="p-4">
			<h1 className="text-xl font-bold mb-4 gradient-text">Dashboard</h1>

			{/* Stats cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
				<div className="cyber-card rounded p-3">
					<div className="text-gray-400 text-xs mb-0.5">Total Users</div>
					<div className="text-2xl font-bold text-cyan-400">{stats?.totalUsers || 0}</div>
				</div>
				<div className="cyber-card rounded p-3">
					<div className="text-gray-400 text-xs mb-0.5">Total Generations</div>
					<div className="text-2xl font-bold text-cyan-400">{stats?.totalGenerations || 0}</div>
				</div>
				<div className="cyber-card rounded p-3">
					<div className="text-gray-400 text-xs mb-0.5">Total Cost</div>
					<div className="text-2xl font-bold text-pink-400">${(stats?.totalCost || 0).toFixed(4)}</div>
				</div>
				<div className="cyber-card rounded p-3">
					<div className="text-gray-400 text-xs mb-0.5">This Month</div>
					<div className="text-2xl font-bold text-cyan-400">{stats?.thisMonth?.imageCount || 0}</div>
					<div className="text-xs text-pink-400">${(stats?.thisMonth?.totalCost || 0).toFixed(4)}</div>
				</div>
			</div>

			{/* Quick actions */}
			<div className="grid grid-cols-2 gap-3 mb-4">
				<Link to="/admin/users" className="cyber-card hover:neon-border rounded p-3 transition-all">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 rounded">
							<svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Users">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						</div>
						<div>
							<div className="font-medium text-sm">Manage Users</div>
							<div className="text-xs text-gray-500">View and edit accounts</div>
						</div>
					</div>
				</Link>
				<Link to="/admin/products" className="cyber-card hover:neon-border rounded p-3 transition-all">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 rounded">
							<svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Products">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
							</svg>
						</div>
						<div>
							<div className="font-medium text-sm">Products</div>
							<div className="text-xs text-gray-500">Subscription tiers</div>
						</div>
					</div>
				</Link>
			</div>

			{/* Recent users */}
			{stats?.recentUsers && stats.recentUsers.length > 0 && (
				<div className="cyber-card rounded p-3">
					<h2 className="text-sm font-semibold mb-2 text-gray-300">Recent Users</h2>
					<div className="space-y-1.5">
						{stats.recentUsers.map((user) => (
							<Link
								key={user.id}
								to={`/admin/users/${user.id}`}
								className="flex items-center justify-between p-2 bg-cyan-500/5 rounded hover:bg-cyan-500/10 transition-colors"
							>
								<div className="flex items-center gap-2">
									<div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
										{user.username.charAt(0).toUpperCase()}
									</div>
									<div>
										<div className="text-sm font-medium">{user.username}</div>
										<div className="text-[10px] text-gray-500">{new Date(user.created_at).toLocaleDateString()}</div>
									</div>
								</div>
								<svg className="w-4 h-4 text-cyan-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="View">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
