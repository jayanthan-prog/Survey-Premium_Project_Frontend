import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ReleasesModule = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const basePath = user?.role === "APPROVER" ? "/approver" : "/admin";
    const stats = [
        { label: "Active", value: 5, tone: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Frozen", value: 2, tone: "text-amber-600", bg: "bg-amber-50" },
        { label: "Stopped", value: 1, tone: "text-rose-600", bg: "bg-rose-50" },
        { label: "Scheduled", value: 3, tone: "text-slate-600", bg: "bg-slate-50" },
    ];

    const releases = useMemo(
        () => [
            {
                id: "REL-210",
                survey: "Hostel Preference 2026",
                status: "Active",
                audience: "First Year",
                window: "2026-02-01 → 2026-02-15",
                responses: 812,
                completionRate: 92,
                owner: "Admin",
            },
            {
                id: "REL-209",
                survey: "Internship Willingness",
                status: "Frozen",
                audience: "Final Year",
                window: "2026-01-20 → 2026-02-05",
                responses: 560,
                completionRate: 78,
                owner: "Approver",
            },
            {
                id: "REL-207",
                survey: "Elective Course Bidding",
                status: "Stopped",
                audience: "All UG",
                window: "2026-01-05 → 2026-01-18",
                responses: 904,
                completionRate: 88,
                owner: "Admin",
            },
            {
                id: "REL-205",
                survey: "Transport Facilities Feedback",
                status: "Scheduled",
                audience: "All Students",
                window: "2026-02-20 → 2026-03-05",
                responses: 0,
                completionRate: 0,
                owner: "Admin",
            },
        ],
        []
    );

    const [selectedReleaseId, setSelectedReleaseId] = useState(releases[0]?.id);
    const selectedRelease = releases.find((item) => item.id === selectedReleaseId);

    const statusBadge = (status) => {
        switch (status) {
            case "Active":
                return "bg-emerald-50 text-emerald-700";
            case "Frozen":
                return "bg-amber-50 text-amber-700";
            case "Stopped":
                return "bg-rose-50 text-rose-700";
            default:
                return "bg-slate-50 text-slate-600";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Survey Releases</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${stat.bg} ${stat.tone}`}>
                            {stat.label}
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-gray-900">{stat.value}</div>
                        <p className="text-xs text-gray-400 mt-1">Updated today</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">Published Releases</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {releases.map((release) => (
                            <button
                                type="button"
                                key={release.id}
                                onClick={() => setSelectedReleaseId(release.id)}
                                className={`w-full text-left px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-slate-50 transition ${selectedReleaseId === release.id ? "bg-slate-50" : "bg-white"
                                    }`}
                            >
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{release.survey}</div>
                                    <div className="text-xs text-gray-500">{release.id} · Audience: {release.audience}</div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusBadge(release.status)}`}>
                                        {release.status}
                                    </span>
                                    <div>{release.window}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Release Details</h3>
                    {selectedRelease ? (
                        <>
                            <div>
                                <div className="text-xs text-gray-400">Survey</div>
                                <div className="font-medium text-gray-900">{selectedRelease.survey}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-xs text-gray-400">Release ID</div>
                                    <div className="text-gray-700">{selectedRelease.id}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Status</div>
                                    <div className="text-gray-700">{selectedRelease.status}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Responses</div>
                                    <div className="text-gray-700">{selectedRelease.responses}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Completion</div>
                                    <div className="text-gray-700">{selectedRelease.completionRate}%</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Release Window</div>
                                <div className="text-sm text-gray-700">{selectedRelease.window}</div>
                            </div>
                            <div className="pt-2 space-y-2">
                                <button
                                    onClick={() =>
                                        navigate(`${basePath}/releases/${selectedRelease.id}/edit`, {
                                            state: { release: selectedRelease },
                                        })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                                >
                                    Modify Release
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 hover:bg-amber-100">
                                        Freeze Window
                                    </button>
                                    <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-100">
                                        Resume
                                    </button>
                                    <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100">
                                        Stop Responses
                                    </button>
                                    <button className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100">
                                        Archive
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Select a release to manage.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReleasesModule;
