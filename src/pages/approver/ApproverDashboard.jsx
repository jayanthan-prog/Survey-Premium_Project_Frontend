import { useEffect, useState } from "react";
import { ClipboardDocumentCheckIcon, UserGroupIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary } from "../../services/dashboardService";

export const ApproverDashboard = () => {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!token) {
        if (active) {
          setError("Missing auth session.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getDashboardSummary(token);
        if (!active) return;
        setDashboard(response);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [token]);

  const overview = dashboard?.overview || {};
  const recentApprovals = dashboard?.recent_approvals || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Approver Dashboard</h1>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading dashboard...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-amber-700">
            <ClipboardDocumentCheckIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">Pending Approvals</span>
          </div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{overview.pending_approvals || 0}</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-700">
            <UserGroupIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">Groups</span>
          </div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{overview.groups || 0}</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-purple-700">
            <ChartBarIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">Active Releases</span>
          </div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{overview.active_releases || 0}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Latest Approval Queue</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentApprovals.map((item) => (
            <div key={item.approval_item_id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">#{item.approval_item_id} · {item.entity_type}</div>
                <div className="text-xs text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-semibold ${String(item.status).toUpperCase() === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                {item.status}
              </span>
            </div>
          ))}
          {!recentApprovals.length && (
            <div className="px-5 py-4 text-sm text-gray-500">No approvals found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
