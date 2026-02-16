import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AllocationModule = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const allocations = useMemo(
        () => [
            {
                id: "ALC-101",
                title: "Mock Interview Batch A",
                type: "Mock Interview",
                status: "Active",
                window: "2026-02-10 → 2026-02-12",
                owner: "Admin",
            },
            {
                id: "ALC-096",
                title: "Database Practical",
                type: "Practical",
                status: "Scheduled",
                window: "2026-02-18 → 2026-02-20",
                owner: "Approver",
            },
            {
                id: "ALC-090",
                title: "Assessment Round 1",
                type: "Assessment",
                status: "Completed",
                window: "2026-01-20 → 2026-01-22",
                owner: "Admin",
            },
        ],
        []
    );

    const filteredAllocations = allocations.filter((item) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;
        return (
            item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Allocation</h1>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/admin/allocation/create")}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                >
                    + Add Allocation
                </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="font-semibold text-gray-800">All Allocations</h2>
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search allocations..."
                        className="w-60 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Allocation</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold">Window</th>
                                <th className="px-6 py-3 font-semibold">Owner</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAllocations.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{item.title}</div>
                                        <div className="text-xs text-gray-500">{item.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{item.type}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.window}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.owner}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-[10px] font-semibold ${item.status === "Active"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : item.status === "Scheduled"
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-slate-50 text-slate-600"
                                                }`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-xs">
                                            <button className="text-purple-600 hover:underline">Edit</button>
                                            <button className="text-rose-600 hover:underline">Remove</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!filteredAllocations.length && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={6}>
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
