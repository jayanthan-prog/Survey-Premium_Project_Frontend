import {
  PlusIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

export const AdminDashboard = () => {
  // Stat data based on SRS Page 54 widgets
  const stats = [
    { name: "Active Releases", value: "3", icon: ChartBarIcon, sub: "Closing soon: 1", color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Pending Approvals", value: "18", icon: ClipboardDocumentCheckIcon, sub: "Docs: 12, Selections: 6", color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Waitlist Summary", value: "42", icon: UserGroupIcon, sub: "Across 4 options", color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Errors/Conflicts", value: "2", icon: ExclamationTriangleIcon, sub: "Failed allocations", color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header & Quick Actions (From SRS Page 55) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Operations Home</h1>
          <div className="text-sm text-gray-500">Overview of active surveys and system health.</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <PlusIcon className="w-4 h-4" /> Create New Survey
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <ArrowPathIcon className="w-4 h-4" /> Run Allocation
          </button>
        </div>
      </div>

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
                {[
                  { name: "Hostel Selection 2026", progress: 85, status: "Active" },
                  { name: "Elective Course Bidding", progress: 40, status: "Active" },
                  { name: "Internship Willingness", progress: 100, status: "Closing" },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${row.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">{row.progress}% submitted</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
                { label: "Girls - Block A", used: 48, total: 50 },
                { label: "Machine Learning Elective", used: 29, total: 30 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-bold text-red-600">{item.total - item.used} left</span>
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
            <div className="text-3xl font-bold">14</div>
            <div className="text-slate-400 text-xs mt-1">Users started but did not submit in the last 24h.</div>
            <button className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
              Resend Reminders
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};