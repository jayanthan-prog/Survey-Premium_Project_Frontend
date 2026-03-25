import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { fetchAuditLogs } from "../../services/auditLogApi";

function toTitle(value) {
    if (!value) return "Unknown";
    return String(value)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTimestamp(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
}

const toneByOutcome = {
    Success: "bg-emerald-100 text-emerald-700",
    Warning: "bg-amber-100 text-amber-700",
    Error: "bg-rose-100 text-rose-700",
};

const AuditLogsModule = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [moduleFilter, setModuleFilter] = useState("All Modules");
    const [outcomeFilter, setOutcomeFilter] = useState("All Outcomes");

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                setLoading(true);
                setError("");
                const response = await fetchAuditLogs({ page: 1, pageSize: 500 });
                const items = Array.isArray(response?.items) ? response.items : [];

                if (!active) return;


                const normalized = items.map((item) => {
                    const meta = item?.new_value || {};
                    const userEmail = item?.User?.email;
                    const userName = item?.User?.name;
                    const actor = userName || userEmail || (item?.actor_user_id ? `user:${item.actor_user_id}` : "system");
                    const module = toTitle(meta.module || item.entity_type);
                    const outcomeRaw = String(meta.outcome || "SUCCESS").toUpperCase();
                    const outcome = outcomeRaw === "SUCCESS" ? "Success" : outcomeRaw === "WARNING" ? "Warning" : "Error";
                    const activity = meta.description || toTitle(item.action || meta.method || "READ");
                    const entity = item.entity_id ? `${item.entity_type || "ENTITY"}-${item.entity_id}` : "-";
                    const description = `${meta.method || "GET"} ${meta.path || "-"} (${meta.status_code || "-"}) - ${meta.response_time_ms || 0}ms`;

                    return {
                        id: item.audit_log_id,
                        timestamp: formatTimestamp(item.created_at),
                        module,
                        activity,
                        entity,
                        description,
                        actor,
                        outcome,
                    };
                });
                setLogs(normalized);
            } catch (loadError) {
                if (!active) return;
                setError(loadError?.message || "Failed to load audit logs.");
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const modules = useMemo(
        () => ["All Modules", ...new Set(logs.map((item) => item.module))],
        [logs]
    );

    const outcomes = useMemo(
        () => ["All Outcomes", ...new Set(logs.map((item) => item.outcome))],
        [logs]
    );

    const filteredLogs = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return logs.filter((item) => {
            const moduleMatch = moduleFilter === "All Modules" || item.module === moduleFilter;
            const outcomeMatch = outcomeFilter === "All Outcomes" || item.outcome === outcomeFilter;
            if (!moduleMatch) return false;
            if (!outcomeMatch) return false;

            if (!query) return true;
            return [item.timestamp, item.module, item.activity, item.entity, item.description, item.actor, item.outcome]
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [logs, searchTerm, moduleFilter, outcomeFilter]);

    const firstTimestamp = filteredLogs[0]?.timestamp || "-";
    const lastTimestamp = filteredLogs[filteredLogs.length - 1]?.timestamp || "-";

    const downloadExcel = () => {
        const rows = filteredLogs.map((row) => ({
            Timestamp: row.timestamp,
            Module: row.module,
            Activity: row.activity,
            Entity: row.entity,
            Description: row.description,
            Actor: row.actor,
            Outcome: row.outcome,
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
        XLSX.writeFile(workbook, "audit-logs.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
                    <p className="text-xs text-gray-600 mt-1 font-bold">Last Updated: {firstTimestamp} to {lastTimestamp}</p>
                </div>
                <button
                    onClick={downloadExcel}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                    <Download size={16} /> Download Excel
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={17} />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search activities, modules, entity IDs, actor..."
                            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                    </div>
                    <select
                        value={moduleFilter}
                        onChange={(event) => setModuleFilter(event.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    >
                        {modules.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <select
                        value={outcomeFilter}
                        onChange={(event) => setOutcomeFilter(event.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    >
                        {outcomes.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500">
                    Total Logs: <span className="font-semibold text-gray-700">{filteredLogs.length}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Timestamp</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Module</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Activity</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Entity</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Description</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actor</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Outcome</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && (
                                <tr>
                                    <td className="px-4 py-8 text-sm text-gray-500 text-center" colSpan={7}>
                                        Loading audit logs...
                                    </td>
                                </tr>
                            )}
                            {!loading && error && (
                                <tr>
                                    <td className="px-4 py-8 text-sm text-rose-600 text-center" colSpan={7}>
                                        {error}
                                    </td>
                                </tr>
                            )}
                            {!loading && !error && filteredLogs.map((log) => (
                                <tr key={`${log.timestamp}-${log.entity}-${log.activity}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{log.timestamp}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">{log.module}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.activity}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{log.entity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[380px]">{log.description}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{log.actor}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${toneByOutcome[log.outcome] || "bg-gray-100 text-gray-700"}`}>
                                            {log.outcome}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && !error && !filteredLogs.length && (
                                <tr>
                                    <td className="px-4 py-8 text-sm text-gray-500 text-center" colSpan={7}>
                                        No audit logs found for the selected filters.
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

export default AuditLogsModule;
