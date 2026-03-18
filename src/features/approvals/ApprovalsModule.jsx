import { useEffect, useMemo, useState } from "react";
import {
    getApprovalActions,
    getApprovalItems,
    getApprovalSteps,
    getApprovalWorkflows,
    updateApprovalItem,
} from "../../services/approvalApi";

const ApprovalsModule = () => {
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const [items, setItems] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [steps, setSteps] = useState([]);
    const [actions, setActions] = useState([]);

    const workflowById = useMemo(
        () => new Map(workflows.map((workflow) => [Number(workflow.approval_workflow_id), workflow])),
        [workflows]
    );

    const stepById = useMemo(
        () => new Map(steps.map((step) => [Number(step.approval_step_id), step])),
        [steps]
    );

    const actionsByItem = useMemo(() => {
        const map = new Map();
        for (const action of actions) {
            const key = Number(action.approval_item_id);
            const existing = map.get(key) || [];
            existing.push(action);
            map.set(key, existing);
        }
        for (const [, value] of map) {
            value.sort((a, b) => new Date(b.acted_at || 0).getTime() - new Date(a.acted_at || 0).getTime());
        }
        return map;
    }, [actions]);

    const getPriority = (item, workflow) => {
        const status = String(item.status || "").toUpperCase();
        if (status === "PENDING") return "High";

        const requestedAt = workflow?.requested_at ? new Date(workflow.requested_at) : null;
        if (!requestedAt) return "Low";

        const ageHours = (Date.now() - requestedAt.getTime()) / (1000 * 60 * 60);
        if (ageHours >= 24) return "High";
        if (ageHours >= 8) return "Medium";
        return "Low";
    };

    const formatDate = (value) => {
        if (!value) return "-";
        try {
            return new Date(value).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return String(value);
        }
    };

    const formatEntityType = (value) => {
        const normalized = String(value || "").toUpperCase();
        if (normalized === "SURVEY") return "Survey";
        if (normalized === "RELEASE") return "Release";
        return "Activity";
    };

    const loadApprovals = async () => {
        try {
            setLoading(true);
            setError("");

            const [itemsRes, workflowsRes, stepsRes, actionsRes] = await Promise.all([
                getApprovalItems(),
                getApprovalWorkflows(),
                getApprovalSteps(),
                getApprovalActions(),
            ]);

            setItems(Array.isArray(itemsRes) ? itemsRes : []);
            setWorkflows(Array.isArray(workflowsRes) ? workflowsRes : []);
            setSteps(Array.isArray(stepsRes) ? stepsRes : []);
            setActions(Array.isArray(actionsRes) ? actionsRes : []);
        } catch (err) {
            setError(err?.message || "Failed to load approvals.");
            setItems([]);
            setWorkflows([]);
            setSteps([]);
            setActions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApprovals();
    }, []);

    const approvals = useMemo(() => {
        return items.map((item) => {
            const workflow = workflowById.get(Number(item.approval_workflow_id));
            const step = item.approval_step_id ? stepById.get(Number(item.approval_step_id)) : null;
            const latestAction = (actionsByItem.get(Number(item.approval_item_id)) || [])[0] || null;
            const type = formatEntityType(item.entity_type || workflow?.entity_type);

            const title = `${type} #${item.entity_id}`;
            const summary = latestAction?.comment
                || workflow?.comments
                || step?.comments
                || "Awaiting decision.";

            return {
                ...item,
                type,
                title,
                summary,
                priority: getPriority(item, workflow),
                submittedAt: workflow?.requested_at || item.created_at,
                requestedBy: workflow?.requested_by || "-",
                currentStepOrder: step?.step_order || null,
            };
        });
    }, [items, workflowById, stepById, actionsByItem]);

    const filteredApprovals = approvals.filter((item) => {
        const itemType = item.type;
        const itemStatus = String(item.status || "").toUpperCase();
        const itemPriority = item.priority;

        const matchesType = typeFilter === "All" || itemType === typeFilter;
        const matchesStatus = statusFilter === "All" || itemStatus === statusFilter;
        const matchesPriority = priorityFilter === "All" || itemPriority === priorityFilter;

        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !query
            || String(item.title || "").toLowerCase().includes(query)
            || String(item.approval_item_id || "").toLowerCase().includes(query)
            || String(item.summary || "").toLowerCase().includes(query)
            || String(item.entity_id || "").toLowerCase().includes(query);

        return matchesType && matchesStatus && matchesPriority && matchesSearch;
    });

    const decide = async (item, decision) => {
        try {
            setActionLoadingId(item.approval_item_id);
            setError("");

            await updateApprovalItem(item.approval_item_id, {
                status: decision,
                decided_at: new Date().toISOString(),
            });

            await loadApprovals();
        } catch (err) {
            setError(err?.message || "Failed to update approval.");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Approvals</h1>
                </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

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
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option value="All">All Status</option>
                            <option value="PENDING">PENDING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="CHANGES_REQUESTED">CHANGES_REQUESTED</option>
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
                                    <th className="px-6 py-3 font-semibold">Requested By</th>
                                    <th className="px-6 py-3 font-semibold">Priority</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 font-semibold">Submitted</th>
                                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={8}>
                                            Loading approvals...
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredApprovals.map((item) => (
                                    <tr key={item.approval_item_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-xs text-gray-500">APR-{item.approval_item_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.title}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.summary}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{item.type}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.requestedBy}</td>
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
                                        <td className="px-6 py-4 text-xs font-semibold text-gray-600">{String(item.status || "").toUpperCase()}</td>
                                        <td className="px-6 py-4 text-gray-600">{formatDate(item.submittedAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    aria-label="Approve"
                                                    disabled={actionLoadingId === item.approval_item_id}
                                                    onClick={() => decide(item, "APPROVED")}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
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
                                                    disabled={actionLoadingId === item.approval_item_id}
                                                    onClick={() => decide(item, "CHANGES_REQUESTED")}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-60"
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
                                                    disabled={actionLoadingId === item.approval_item_id}
                                                    onClick={() => decide(item, "REJECTED")}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
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
                                {!loading && !filteredApprovals.length && (
                                    <tr>
                                        <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={8}>
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
