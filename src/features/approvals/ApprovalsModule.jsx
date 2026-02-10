import { useMemo, useState } from "react";

const ApprovalsModule = () => {
    const [typeFilter, setTypeFilter] = useState("All");
    const [creatorFilter, setCreatorFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const approvals = useMemo(
        () => [
            {
                id: "APR-S-120",
                title: "Hostel Preference 2026",
                createdBy: "Student",
                submittedAt: "2026-02-06",
                priority: "High",
                type: "Survey",
                summary: "Survey draft submitted for admin approval.",
            },
            {
                id: "APR-S-118",
                title: "Internship Willingness",
                createdBy: "Approver",
                submittedAt: "2026-02-04",
                priority: "Medium",
                type: "Survey",
                summary: "Updated questions and response window.",
            },
            {
                id: "APR-R-77",
                title: "Elective Course Bidding",
                createdBy: "Approver",
                submittedAt: "2026-02-03",
                priority: "High",
                type: "Release",
                summary: "Release window adjustment requested.",
            },
            {
                id: "APR-R-72",
                title: "Transport Facilities Feedback",
                createdBy: "Student",
                submittedAt: "2026-01-31",
                priority: "Low",
                type: "Release",
                summary: "New release request with restricted audience.",
            },
            {
                id: "APR-A-18",
                title: "Document verification batch",
                createdBy: "Student",
                submittedAt: "2026-02-02",
                priority: "Medium",
                type: "Activity",
                summary: "Student activity request for verification run.",
            },
            {
                id: "APR-A-14",
                title: "Allocation run request",
                createdBy: "Approver",
                submittedAt: "2026-02-01",
                priority: "High",
                type: "Activity",
                summary: "Approver requested allocation rerun.",
            },
        ],
        []
    );

    const filteredApprovals = approvals.filter((item) => {
        const matchesType = typeFilter === "All" || item.type === typeFilter;
        const matchesCreator = creatorFilter === "All" || item.createdBy === creatorFilter;
        const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !query ||
            item.title.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query) ||
            item.summary.toLowerCase().includes(query);
        return matchesType && matchesCreator && matchesPriority && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Approvals</h1>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="font-semibold text-gray-800">Pending Approvals</h2>
                    <div className="flex flex-wrap gap-2">
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search approvals..."
                            className="w-52 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                        <select
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option value="All">All Types</option>
                            <option value="Survey">Survey</option>
                            <option value="Release">Release</option>
                            <option value="Activity">Activity</option>
                        </select>
                        <select
                            value={creatorFilter}
                            onChange={(event) => setCreatorFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option value="All">All Creators</option>
                            <option value="Approver">Approver</option>
                            <option value="Student">Student</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(event) => setPriorityFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option value="All">All Priorities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div className="max-h-[420px] overflow-y-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">ID</th>
                                    <th className="px-6 py-3 font-semibold">Title</th>
                                    <th className="px-6 py-3 font-semibold">Type</th>
                                    <th className="px-6 py-3 font-semibold">Created By</th>
                                    <th className="px-6 py-3 font-semibold">Priority</th>
                                    <th className="px-6 py-3 font-semibold">Submitted</th>
                                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredApprovals.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-xs text-gray-500">{item.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.title}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.summary}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{item.type}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.createdBy}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-[10px] font-semibold ${item.priority === "High"
                                                    ? "bg-rose-50 text-rose-700"
                                                    : item.priority === "Medium"
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-slate-50 text-slate-600"
                                                    }`}
                                            >
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{item.submittedAt}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    aria-label="Approve"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="h-4 w-4"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Request changes"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="h-4 w-4"
                                                    >
                                                        <path d="M12 20h9" />
                                                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Reject"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="h-4 w-4"
                                                    >
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filteredApprovals.length && (
                                    <tr>
                                        <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={7}>
                                            No approvals match the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalsModule;
