import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createActionPlan, deleteActionPlan, getActionPlans, updateActionPlan } from "../../services/actionPlanApi";
import { useConfirmation } from "../../context/ConfirmationContext";
import { getSurveys } from "../../services/surveyApi";

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "COMPLETED", "DROPPED"];

const statusClass = {
    PENDING: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-green-100 text-green-700",
    DROPPED: "bg-gray-100 text-gray-700",
};

const extractTargetDate = (description) => {
    const value = String(description || "");
    const match = value.match(/\[Target Date:\s*([^\]]+)\]/i);
    return match ? match[1] : "-";
};

const stripTargetDateFromDescription = (description) => {
    const value = String(description || "");
    return value.replace(/\[Target Date:\s*([^\]]+)\]\s*/i, "").trim();
};

export const ActionPlansModule = () => {
    const { user } = useAuth();
    const { confirm } = useConfirmation();

    const [plans, setPlans] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [actionBusyId, setActionBusyId] = useState(null);
    const [showNewPlan, setShowNewPlan] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        title: "",
        surveyId: "",
        targetDate: "",
        description: "",
    });

    const role = String(user?.role || "").toUpperCase();
    const canManage = role === "ADMIN" || role === "APPROVER";

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            if (!canManage) {
                setPlans([]);
                setSurveys([]);
                return;
            }

            const [plansRes, surveysRes] = await Promise.all([
                getActionPlans(),
                getSurveys(),
            ]);

            setPlans(Array.isArray(plansRes) ? plansRes : []);

            const surveyList = Array.isArray(surveysRes) ? surveysRes : [];
            setSurveys(surveyList);
            if (!form.surveyId && surveyList.length) {
                setForm((prev) => ({ ...prev, surveyId: String(surveyList[0].survey_id) }));
            }
        } catch (err) {
            setError(err?.message || "Failed to load action plans.");
            setPlans([]);
            setSurveys([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [canManage]);

    const stats = useMemo(() => {
        const byStatus = plans.reduce((acc, plan) => {
            const status = String(plan.status || "PENDING").toUpperCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return [
            { label: "Pending", value: byStatus.PENDING || 0 },
            { label: "In Progress", value: byStatus.IN_PROGRESS || 0 },
            { label: "Completed", value: byStatus.COMPLETED || 0 },
            { label: "Dropped", value: byStatus.DROPPED || 0 },
        ];
    }, [plans]);

    const rows = useMemo(() => plans.map((plan) => {
        const survey = surveys.find((entry) => String(entry.survey_id) === String(plan.survey_id));
        const normalizedStatus = String(plan.status || "PENDING").toUpperCase();
        return {
            id: plan.action_plan_id,
            name: plan.title,
            owner: survey?.title || `Survey #${plan.survey_id}`,
            due: extractTargetDate(plan.description),
            status: normalizedStatus,
            description: plan.description || "",
        };
    }), [plans, surveys]);

    const onCreatePlan = async (event) => {
        event.preventDefault();
        if (!canManage) return;

        if (!form.title.trim() || !form.surveyId) {
            setError("Title and survey are required.");
            return;
        }

        try {
            setCreating(true);
            setError("");

            const nextId = plans.reduce((max, plan) => {
                const numeric = Number(plan?.action_plan_id);
                return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
            }, 0) + 1;

            const detailText = String(form.description || "").trim();
            const description = form.targetDate
                ? `[Target Date: ${form.targetDate}] ${detailText}`.trim()
                : detailText;

            await createActionPlan({
                action_plan_id: nextId,
                survey_id: Number(form.surveyId),
                title: form.title,
                description,
                status: "PENDING",
            });

            setForm({
                title: "",
                surveyId: surveys.length ? String(surveys[0].survey_id) : "",
                targetDate: "",
                description: "",
            });
            setShowNewPlan(false);
            await load();
        } catch (err) {
            setError(err?.message || "Failed to create action plan.");
        } finally {
            setCreating(false);
        }
    };

    const onEditPlan = (row) => {
        if (!canManage) return;

        const targetDate = row.due && row.due !== "-" ? row.due : "";
        setForm({
            title: row.name || "",
            surveyId: String(
                plans.find((plan) => String(plan.action_plan_id) === String(row.id))?.survey_id || ""
            ),
            targetDate,
            description: stripTargetDateFromDescription(row.description),
        });
        setEditingId(row.id);
        setShowNewPlan(true);
    };

    const onUpdatePlan = async (event) => {
        event.preventDefault();
        if (!canManage || !editingId) return;

        if (!form.title.trim() || !form.surveyId) {
            setError("Title and survey are required.");
            return;
        }

        try {
            setCreating(true);
            setError("");

            const detailText = String(form.description || "").trim();
            const description = form.targetDate
                ? `[Target Date: ${form.targetDate}] ${detailText}`.trim()
                : detailText;

            const existing = plans.find((plan) => String(plan.action_plan_id) === String(editingId));

            await updateActionPlan(editingId, {
                survey_id: Number(form.surveyId),
                title: form.title,
                description,
                status: existing?.status || "PENDING",
            });

            setForm({
                title: "",
                surveyId: surveys.length ? String(surveys[0].survey_id) : "",
                targetDate: "",
                description: "",
            });
            setEditingId(null);
            setShowNewPlan(false);
            await load();
        } catch (err) {
            setError(err?.message || "Failed to update action plan.");
        } finally {
            setCreating(false);
        }
    };

    const findPlanById = (id) => plans.find((plan) => String(plan.action_plan_id) === String(id));

    const onApprovePlan = async (row) => {
        if (!canManage) return;

        const approved = await confirm({
            title: "Approve Action Plan",
            message: `Approve "${row.name}"? This marks it as COMPLETED.`,
            confirmText: "Approve",
            tone: "info",
        });
        if (!approved) return;

        const existing = findPlanById(row.id);
        if (!existing) return;

        try {
            setActionBusyId(row.id);
            await updateActionPlan(row.id, {
                survey_id: Number(existing.survey_id),
                title: existing.title,
                description: existing.description,
                status: "COMPLETED",
            });
            await load();
        } catch (err) {
            setError(err?.message || "Failed to approve action plan.");
        } finally {
            setActionBusyId(null);
        }
    };

    const onRejectPlan = async (row) => {
        if (!canManage) return;

        const approved = await confirm({
            title: "Reject Action Plan",
            message: `Reject "${row.name}"? This marks it as DROPPED.`,
            confirmText: "Reject",
            tone: "warning",
        });
        if (!approved) return;

        const existing = findPlanById(row.id);
        if (!existing) return;

        try {
            setActionBusyId(row.id);
            await updateActionPlan(row.id, {
                survey_id: Number(existing.survey_id),
                title: existing.title,
                description: existing.description,
                status: "DROPPED",
            });
            await load();
        } catch (err) {
            setError(err?.message || "Failed to reject action plan.");
        } finally {
            setActionBusyId(null);
        }
    };

    const onDeletePlan = async (row) => {
        if (!canManage) return;

        const approved = await confirm({
            title: "Delete Action Plan",
            message: `Delete "${row.name}" permanently? This cannot be undone.`,
            confirmText: "Delete",
            tone: "danger",
        });
        if (!approved) return;

        try {
            setActionBusyId(row.id);
            await deleteActionPlan(row.id);
            await load();
        } catch (err) {
            setError(err?.message || "Failed to delete action plan.");
        } finally {
            setActionBusyId(null);
        }
    };

    return (
        <div className="space-y-6 p-3 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Action Plans</h1>
                    <p className="text-xs text-gray-500 mt-1">Plan upcoming events and day-wise actions.</p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setShowNewPlan((prev) => !prev);
                            }}
                            className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
                        >
                            New Plan
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            {showNewPlan && canManage && (
                <form onSubmit={editingId ? onUpdatePlan : onCreatePlan} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            value={form.title}
                            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                            placeholder="Action title"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            required
                        />
                        <select
                            value={form.surveyId}
                            onChange={(event) => setForm((prev) => ({ ...prev, surveyId: event.target.value }))}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            required
                        >
                            {!surveys.length && <option value="">No surveys available</option>}
                            {surveys.map((survey) => (
                                <option key={survey.survey_id} value={survey.survey_id}>{survey.title}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={form.targetDate}
                            onChange={(event) => setForm((prev) => ({ ...prev, targetDate: event.target.value }))}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                        <input
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                            placeholder="Plan details"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowNewPlan(false);
                                setEditingId(null);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                        >
                            {creating ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Plan")}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((item) => (
                    <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800">Upcoming / Active Plans</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Action</th>
                                <th className="px-4 py-3 font-semibold">Survey</th>
                                <th className="px-4 py-3 font-semibold">Target Date</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={canManage ? 5 : 4}>Loading action plans...</td>
                                </tr>
                            )}
                            {!loading && rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{row.owner}</td>
                                    <td className="px-4 py-3 text-gray-600">{row.due}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${statusClass[row.status] || "bg-gray-100 text-gray-700"}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => onApprovePlan(row)}
                                                    disabled={actionBusyId === row.id || row.status === "COMPLETED"}
                                                    title="Approve"
                                                    aria-label="Approve"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onRejectPlan(row)}
                                                    disabled={actionBusyId === row.id || row.status === "DROPPED"}
                                                    title="Reject"
                                                    aria-label="Reject"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onEditPlan(row)}
                                                    disabled={actionBusyId === row.id}
                                                    title="Edit"
                                                    aria-label="Edit"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-60"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeletePlan(row)}
                                                    disabled={actionBusyId === row.id}
                                                    title="Delete"
                                                    aria-label="Delete"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {!loading && !rows.length && (
                                <tr>
                                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={canManage ? 5 : 4}>No action plans found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
