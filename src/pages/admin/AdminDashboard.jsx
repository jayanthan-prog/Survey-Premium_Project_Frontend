import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary } from "../../services/dashboardService";

export const AdminDashboard = () => {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!token) {
        if (active) {
          setLoading(false);
          setError("Missing auth session.");
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
  const recentReleases = dashboard?.recent_releases || [];

  const stats = useMemo(
    () => [
      {
        name: "Active Releases",
        value: String(overview.active_releases || 0),
        icon: ChartBarIcon,
        sub: "Live release windows",
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        name: "Pending Approvals",
        value: String(overview.pending_approvals || 0),
        icon: ClipboardDocumentCheckIcon,
        sub: "Awaiting approver action",
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        name: "Total Users",
        value: String(overview.users || 0),
        icon: UserGroupIcon,
        sub: "Provisioned user accounts",
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        name: "Action Plans Open",
        value: String(overview.action_plans_pending || 0),
        icon: ExclamationTriangleIcon,
        sub: "Pending/in-progress plans",
        color: "text-red-600",
        bg: "bg-red-50",
      },
    ],
    [overview]
  );

  return (
    <div className="space-y-8">
      {/* 1. Header & Quick Actions (From SRS Page 55) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>

        {/* <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <PlusIcon className="w-4 h-4" /> Create New Survey
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <ArrowPathIcon className="w-4 h-4" /> Run Allocation
          </button>
        </div> */}
      </div>

      {loading && <div className="text-sm text-gray-500">Loading dashboard...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* 2. Stats Grid (From SRS Page 54 Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">{item.name}</h3>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              <div className="text-xs text-gray-400 mt-1">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Active Releases Monitor */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Active Releases</h2>
            <button className="text-purple-600 text-sm font-medium hover:underline">View all</button>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Survey Name</th>
                  <th className="px-6 py-3 font-semibold">Progress</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentReleases.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${row.status === "ACTIVE" ? 70 : 100}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">{row.closes_at ? `Closes ${new Date(row.closes_at).toLocaleDateString()}` : "No close date"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!recentReleases.length && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>No releases available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Capacity Hotspots & Drop-offs (From SRS Page 54) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              Capacity Hotspots
            </h2>
            <div className="space-y-4">
              {[
                { label: "Users provisioned", used: overview.users || 0, total: Math.max((overview.users || 0), 1) },
                { label: "Surveys configured", used: overview.surveys || 0, total: Math.max((overview.surveys || 0), 1) },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-bold text-red-600">{item.used}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(item.used / item.total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl text-white shadow-lg shadow-slate-200">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Drop-offs</h3>
            <div className="text-3xl font-bold">{Math.max((overview.my_started || 0) - (overview.my_completed || 0), 0)}</div>
            <div className="text-slate-400 text-xs mt-1">Started vs completed submissions snapshot.</div>
            <button className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
              Resend Reminders
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};