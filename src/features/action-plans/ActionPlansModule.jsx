export const ActionPlansModule = () => {
    const stats = [
        { label: "Draft", value: "6" },
        { label: "In Review", value: "3" },
        { label: "Active", value: "12" },
        { label: "Completed", value: "28" },
    ];

    const rows = [
        { name: "Improve response time", owner: "A. Khan", due: "Feb 18", status: "In Review" },
        { name: "Update hostel capacity", owner: "S. Rao", due: "Feb 20", status: "Active" },
        { name: "Reduce drop-offs", owner: "T. Singh", due: "Mar 01", status: "Draft" },
        { name: "Resolve allocation conflicts", owner: "N. Patel", due: "Mar 05", status: "Active" },
    ];

    const statusClass = {
        Draft: "bg-gray-100 text-gray-700",
        "In Review": "bg-amber-100 text-amber-700",
        Active: "bg-purple-100 text-purple-700",
        Completed: "bg-green-100 text-green-700",
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Action Plans</h1>
                    <p className="text-sm text-gray-500">Track mitigation tasks, owners, and deadlines.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">New Plan</button>
                    <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Export</button>
                </div>
            </div>

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
                    <h2 className="text-sm font-semibold text-gray-800">Priority Actions</h2>
                    <button className="text-sm text-purple-600 hover:underline">View all</button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Action</th>
                            <th className="px-4 py-3 font-semibold">Owner</th>
                            <th className="px-4 py-3 font-semibold">Due</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((row) => (
                            <tr key={row.name} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                <td className="px-4 py-3 text-gray-600">{row.owner}</td>
                                <td className="px-4 py-3 text-gray-600">{row.due}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${statusClass[row.status]}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
