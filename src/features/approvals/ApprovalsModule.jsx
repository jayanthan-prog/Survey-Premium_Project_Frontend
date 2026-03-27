import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    createApprovalAction,
    createApprovalItem,
    createApprovalWorkflow,
    getApprovalActions,
    getApprovalItems,
    getApprovalSteps,
    getApprovalWorkflows,
    updateApprovalWorkflow,
    updateApprovalItem,
} from "../../services/approvalApi";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED", "CHANGES_REQUESTED"];

const ApprovalsModule = ({ mode = "auto" }) => {
    const { user } = useAuth();
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

    const [requestForm, setRequestForm] = useState({
        entity_type: "SURVEY",
        entity_id: "",
        comments: "",
    });
    const [requestLoading, setRequestLoading] = useState(false);

    const normalizedRole = String(user?.role || "").toUpperCase();
    const resolvedMode = mode === "auto"
        ? (normalizedRole === "ADMIN" ? "admin" : "approver")
        : mode;
    const isAdminMode = resolvedMode === "admin";
    const isApproverMode = resolvedMode === "approver";

    const currentUserId = Number(user?.user_id || user?.id || 0) || null;

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

    const nextNumericId = (collection, key) => {
        const maxId = collection.reduce((max, entry) => {
            const value = Number(entry?.[key]);
            return Number.isFinite(value) ? Math.max(max, value) : max;
        }, 0);
        return maxId + 1;
    };

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
        const mapped = items.map((item) => {
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

        return mapped.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
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

            const workflow = workflowById.get(Number(item.approval_workflow_id));
            const decidedAt = new Date().toISOString();

            await updateApprovalItem(item.approval_item_id, {
                status: decision,
                decided_at: decidedAt,
                decided_by: currentUserId,
            });

            if (workflow) {
                await updateApprovalWorkflow(item.approval_workflow_id, {
                    status: decision,
                    approved_by: currentUserId,
                    approved_at: decidedAt,
                });
            }

            await createApprovalAction({
                approval_action_id: nextNumericId(actions, "approval_action_id"),
                approval_item_id: item.approval_item_id,
                actor_user_id: currentUserId,
                acted_by_user_id: currentUserId,
                action: decision,
                comment: `Decision taken: ${decision}`,
                step_order: item.currentStepOrder || 1,
                acted_at: decidedAt,
                created_at: decidedAt,
            });

            await loadApprovals();
        } catch (err) {
            setError(err?.message || "Failed to update approval.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const submitRequest = async (event) => {
        event.preventDefault();

        const entityId = Number(requestForm.entity_id);
        if (!Number.isFinite(entityId) || entityId <= 0) {
            setError("Entity ID must be a positive number.");
            return;
        }

        if (!currentUserId) {
            setError("Unable to identify current user.");
            return;
        }

        try {
            setRequestLoading(true);
            setError("");

            const nowIso = new Date().toISOString();
            const approvalWorkflowId = nextNumericId(workflows, "approval_workflow_id");
            const approvalItemId = nextNumericId(items, "approval_item_id");

            await createApprovalWorkflow({
                approval_workflow_id: approvalWorkflowId,
                entity_type: String(requestForm.entity_type || "SURVEY").toUpperCase(),
                entity_id: entityId,
                requested_by: currentUserId,
                status: "PENDING",
                comments: requestForm.comments || null,
                requested_at: nowIso,
            });

            await createApprovalItem({
                approval_item_id: approvalItemId,
                approval_workflow_id: approvalWorkflowId,
                entity_type: String(requestForm.entity_type || "SURVEY").toUpperCase(),
                entity_id: entityId,
                status: "PENDING",
                created_at: nowIso,
            });

            await createApprovalAction({
                approval_action_id: nextNumericId(actions, "approval_action_id"),
                approval_item_id: approvalItemId,
                actor_user_id: currentUserId,
                acted_by_user_id: currentUserId,
                action: "REQUESTED",
                comment: requestForm.comments || "Approval request raised.",
                step_order: 1,
                acted_at: nowIso,
                created_at: nowIso,
            });

            setRequestForm({
                entity_type: "SURVEY",
                entity_id: "",
                comments: "",
            });

            await loadApprovals();
        } catch (err) {
            setError(err?.message || "Failed to submit request.");
        } finally {
            setRequestLoading(false);
        }
    };

    const headerTitle = isAdminMode ? "Approval Requests" : "Raise Approval Request";
    const tableTitle = isAdminMode ? "Incoming Requests" : "My Requests";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{headerTitle}</h1>
                </div>
                <button
                    type="button"
                    onClick={loadApprovals}
                    disabled={loading}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-70"
                >
                    Refresh
                </button>
            </div>

            {isApproverMode && (
                <form onSubmit={submitRequest} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-gray-900">Submit New Request to Admin</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <select
                            value={requestForm.entity_type}
                            onChange={(event) => setRequestForm((prev) => ({ ...prev, entity_type: event.target.value }))}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option value="SURVEY">Survey</option>
                            <option value="RELEASE">Release</option>
                            <option value="ACTIVITY">Activity</option>
                        </select>
                        <input
                            value={requestForm.entity_id}
                            onChange={(event) => setRequestForm((prev) => ({ ...prev, entity_id: event.target.value }))}
                            placeholder="Entity ID"
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                        <input
                            value={requestForm.comments}
                            onChange={(event) => setRequestForm((prev) => ({ ...prev, comments: event.target.value }))}
                            placeholder="Reason / comment"
                            className="md:col-span-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={requestLoading}
                            className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-70"
                        >
                            {requestLoading ? "Submitting..." : "Raise Request"}
                        </button>
                    </div>
                </form>
            )}

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="font-semibold text-gray-800">{tableTitle}</h2>
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
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
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
                                    <th className="px-6 py-3 font-semibold text-right">{isAdminMode ? "Actions" : "Latest Status"}</th>
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
                                            {isAdminMode ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        aria-label="Approve"
                                                        disabled={actionLoadingId === item.approval_item_id || String(item.status || "").toUpperCase() !== "PENDING"}
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
                                                        disabled={actionLoadingId === item.approval_item_id || String(item.status || "").toUpperCase() !== "PENDING"}
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
                                                        disabled={actionLoadingId === item.approval_item_id || String(item.status || "").toUpperCase() !== "PENDING"}
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
                                            ) : (
                                                <div className="flex justify-end">
                                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                                        {String(item.status || "PENDING").toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
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
