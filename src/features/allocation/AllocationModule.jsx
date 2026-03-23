import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { deleteAllocation, getAllocations, updateAllocation } from "../../services/allocationApi";

const AllocationModule = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [allocations, setAllocations] = useState([]);

    const role = String(user?.role || "").toUpperCase();
    const canManageAllocation = role === "ADMIN" || role === "APPROVER";
    const roleBasePath = role === "APPROVER" ? "/approver" : role === "ADMIN" ? "/admin" : "/student";

    const loadAllocations = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getAllocations();
            setAllocations(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err?.message || "Failed to fetch allocations.");
            setAllocations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllocations();
    }, []);

    const formatDateRange = (startAt, endAt) => {
        const format = (value) => {
            if (!value) return "-";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "-";
            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        };

        return `${format(startAt)} → ${format(endAt)}`;
    };

    const normalizedAllocations = useMemo(
        () => allocations.map((entry) => ({
            ...entry,
            idLabel: `ALC-${entry.allocation_task_id}`,
            typeLabel: String(entry.allocation_type || "TASK").replace(/_/g, " "),
            statusLabel: String(entry.status || "ASSIGNED").toUpperCase(),
            windowLabel: formatDateRange(entry.start_at, entry.end_at),
            ownerLabel: entry.assigned_by_name || `User #${entry.assigned_by}`,
            assigneeLabel: entry.assigned_to_name || `User #${entry.assigned_to}`,
        })),
        [allocations]
    );

    const filteredAllocations = normalizedAllocations.filter((item) => {
        const query = searchTerm.trim().toLowerCase();
        const byStatus = statusFilter === "All" || item.statusLabel === statusFilter;
        const bySearch = !query ||
            String(item.title || "").toLowerCase().includes(query) ||
            String(item.typeLabel || "").toLowerCase().includes(query) ||
            String(item.idLabel || "").toLowerCase().includes(query) ||
            String(item.assigneeLabel || "").toLowerCase().includes(query);

        return byStatus && bySearch;
    });

    const changeStatus = async (item, status) => {
        try {
            setActionLoadingId(item.allocation_task_id);
            setError("");
            await updateAllocation(item.allocation_task_id, { status });
            await loadAllocations();
        } catch (err) {
            setError(err?.message || "Failed to update allocation status.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const removeAllocation = async (item) => {
        try {
            setActionLoadingId(item.allocation_task_id);
            setError("");
            await deleteAllocation(item.allocation_task_id);
            await loadAllocations();
        } catch (err) {
            setError(err?.message || "Failed to remove allocation.");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {canManageAllocation ? "Allocation Management" : "My Allocated Tasks & Schedule"}
                    </h1>
                </div>
                {canManageAllocation && (
                    <button
                        type="button"
                        onClick={() => navigate(`${roleBasePath}/allocation/create`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        + Add Allocation
                    </button>
                )}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="font-semibold text-gray-800">{canManageAllocation ? "All Allocations" : "My Allocations"}</h2>
                    <div className="flex flex-wrap gap-2">
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search allocations..."
                            className="w-60 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        >
                            <option value="All">All Status</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="SCHEDULED">SCHEDULED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Allocation</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold">Window</th>
                                <th className="px-6 py-3 font-semibold">Assigned To</th>
                                <th className="px-6 py-3 font-semibold">Owner</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                {canManageAllocation && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={canManageAllocation ? 7 : 6}>
                                        Loading allocations...
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredAllocations.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{item.title}</div>
                                        <div className="text-xs text-gray-500">{item.idLabel}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{item.typeLabel}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.windowLabel}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.assigneeLabel}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.ownerLabel}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-[10px] font-semibold ${item.statusLabel === "COMPLETED"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : item.statusLabel === "SCHEDULED"
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-slate-50 text-slate-600"
                                                }`}
                                        >
                                            {item.statusLabel}
                                        </span>
                                    </td>
                                    {canManageAllocation && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-xs">
                                                <select
                                                    value={item.statusLabel}
                                                    disabled={actionLoadingId === item.allocation_task_id}
                                                    onChange={(event) => changeStatus(item, event.target.value)}
                                                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                                >
                                                    <option value="ASSIGNED">ASSIGNED</option>
                                                    <option value="SCHEDULED">SCHEDULED</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                    <option value="CANCELLED">CANCELLED</option>
                                                </select>
                                                <button
                                                    onClick={() => removeAllocation(item)}
                                                    disabled={actionLoadingId === item.allocation_task_id}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                                    aria-label="Remove allocation"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {!filteredAllocations.length && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={canManageAllocation ? 7 : 6}>
                                        No allocations found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllocationModule;
