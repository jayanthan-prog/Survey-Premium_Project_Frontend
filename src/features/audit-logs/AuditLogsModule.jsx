import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import * as XLSX from "xlsx";

const auditLogs = [
    {
        timestamp: "2025-01-03 09:15:00",
        module: "Users",
        activity: "User created",
        entity: "USR-0001",
        description: "Admin created user profile for A. Khan (Student)",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-01-06 11:04:00",
        module: "Groups",
        activity: "Group created",
        entity: "GRP-1001",
        description: "Created Group - Year 1 Boys",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-01-08 15:22:00",
        module: "Groups",
        activity: "Members imported",
        entity: "GRP-1001",
        description: "Bulk imported 120 members from spreadsheet",
        actor: "approver@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-01-15 10:35:00",
        module: "Surveys",
        activity: "Survey created",
        entity: "SVY-1009",
        description: "Transport Facilities Feedback survey drafted",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-01-18 16:47:00",
        module: "Releases",
        activity: "Survey released",
        entity: "REL-2201",
        description: "Release opened for All Students",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-01-24 19:10:00",
        module: "Surveys",
        activity: "Survey submitted",
        entity: "SVY-1009",
        description: "Submission received from student STU-4421",
        actor: "student:STU-4421",
        outcome: "Success",
    },
    {
        timestamp: "2025-02-03 08:52:00",
        module: "Approvals",
        activity: "Approval requested",
        entity: "APP-5102",
        description: "Verification request raised for hostel document",
        actor: "student:STU-3018",
        outcome: "Success",
    },
    {
        timestamp: "2025-02-03 12:22:00",
        module: "Approvals",
        activity: "Approval completed",
        entity: "APP-5102",
        description: "Approver accepted submitted proof",
        actor: "approver@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-02-19 17:05:00",
        module: "Action Plans",
        activity: "Action plan created",
        entity: "AP-7001",
        description: "Created plan to reduce non-submission rate",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-03-01 09:41:00",
        module: "Action Plans",
        activity: "Task assigned",
        entity: "API-7001-01",
        description: "Assigned reminder workflow to Student Affairs",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-03-18 13:27:00",
        module: "Surveys",
        activity: "Survey updated",
        entity: "SVY-1017",
        description: "Elective Course Bidding survey questions revised",
        actor: "approver@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-03-29 10:19:00",
        module: "Documents",
        activity: "Document uploaded",
        entity: "DOC-8830",
        description: "Uploaded policy circular for elective workflow",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-04-05 14:58:00",
        module: "Allocation",
        activity: "Allocation run started",
        entity: "RUN-3104",
        description: "Hostel allocation cycle started",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-04-05 15:32:00",
        module: "Allocation",
        activity: "Conflict detected",
        entity: "RUN-3104",
        description: "2 capacity conflicts identified in Block A",
        actor: "system",
        outcome: "Warning",
    },
    {
        timestamp: "2025-04-08 11:02:00",
        module: "Groups",
        activity: "Group updated",
        entity: "GRP-1004",
        description: "Updated membership rule for final year students",
        actor: "approver@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-04-25 16:44:00",
        module: "Users",
        activity: "User role updated",
        entity: "USR-0144",
        description: "Changed role from Student to Approver",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-05-02 09:11:00",
        module: "Surveys",
        activity: "Survey created",
        entity: "SVY-1020",
        description: "Internship Willingness survey created",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-05-10 18:06:00",
        module: "Action Plans",
        activity: "Action plan overdue",
        entity: "AP-7003",
        description: "Plan exceeded target completion date",
        actor: "system",
        outcome: "Warning",
    },
    {
        timestamp: "2025-05-22 12:57:00",
        module: "Surveys",
        activity: "Survey closed",
        entity: "SVY-1020",
        description: "Release closed after deadline reached",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-06-04 10:21:00",
        module: "Approvals",
        activity: "Approval rejected",
        entity: "APP-5282",
        description: "Document rejected due to mismatch",
        actor: "approver@campus.edu",
        outcome: "Warning",
    },
    {
        timestamp: "2025-06-17 08:48:00",
        module: "Users",
        activity: "Login failed",
        entity: "USR-0228",
        description: "Multiple failed login attempts detected",
        actor: "student:STU-0228",
        outcome: "Error",
    },
    {
        timestamp: "2025-07-01 09:50:00",
        module: "Surveys",
        activity: "Survey created",
        entity: "SVY-1024",
        description: "Hostel Preference 2026 survey created",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-08-16 14:12:00",
        module: "Calendar",
        activity: "Calendar slot booked",
        entity: "CAL-4009",
        description: "Booked verification slot for 19-Aug",
        actor: "student:STU-7741",
        outcome: "Success",
    },
    {
        timestamp: "2025-10-05 10:03:00",
        module: "Action Plans",
        activity: "Action plan completed",
        entity: "AP-7001",
        description: "Reminder optimization plan marked complete",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2025-12-21 18:31:00",
        module: "System",
        activity: "Backup completed",
        entity: "SYS-BKP-22",
        description: "Year-end audit database backup generated",
        actor: "system",
        outcome: "Success",
    },
    {
        timestamp: "2026-01-20 10:16:00",
        module: "Surveys",
        activity: "Survey report generated",
        entity: "SVY-1024",
        description: "Generated completion and response analytics report",
        actor: "approver@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2026-02-12 09:22:00",
        module: "Settings",
        activity: "Security policy updated",
        entity: "CFG-901",
        description: "Updated session timeout and token rotation rules",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
    {
        timestamp: "2026-02-25 11:40:00",
        module: "System",
        activity: "Audit log export",
        entity: "AUD-EXP-001",
        description: "Exported full audit log as Excel",
        actor: "admin@campus.edu",
        outcome: "Success",
    },
];

const toneByOutcome = {
    Success: "bg-emerald-100 text-emerald-700",
    Warning: "bg-amber-100 text-amber-700",
    Error: "bg-rose-100 text-rose-700",
};

const AuditLogsModule = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [moduleFilter, setModuleFilter] = useState("All Modules");

    const modules = useMemo(
        () => ["All Modules", ...new Set(auditLogs.map((item) => item.module))],
        []
    );

    const filteredLogs = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return auditLogs.filter((item) => {
            const moduleMatch = moduleFilter === "All Modules" || item.module === moduleFilter;
            if (!moduleMatch) return false;

            if (!query) return true;
            return [item.timestamp, item.module, item.activity, item.entity, item.description, item.actor, item.outcome]
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [searchTerm, moduleFilter]);

    const firstTimestamp = auditLogs[0]?.timestamp;
    const lastTimestamp = auditLogs[auditLogs.length - 1]?.timestamp;

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                            {filteredLogs.map((log) => (
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
                            {!filteredLogs.length && (
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
