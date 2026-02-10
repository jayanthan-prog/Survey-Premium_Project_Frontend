import { useState } from "react";
import { Search, Filter, Download, UserPlus } from "lucide-react";
import ExcelImporter from "../groups/components/ExcelImporter";
import { useNavigate } from "react-router-dom";

const UsersModule = () => {
    const navigate = useNavigate();
    // Sample Data matching SRS Schema (Page 22)
    const [users, setUsers] = useState([
        { id: 1, name: "John Doe", email: "john@edu.com", category: "Boys", year: "2", status: "Active" },
        { id: 2, name: "Jane Smith", email: "jane@edu.com", category: "Girls", year: "3", status: "Active" },
        { id: 3, name: "Alex Wong", email: "alex@edu.com", category: "Boys", year: "1", status: "Inactive" },
    ]);

    const handleImport = (rows) => {
        if (!Array.isArray(rows) || rows.length === 0) {
            return;
        }

        const nextUsers = rows.map((row, index) => {
            const name = row.name || row.fullName || row.Name || row["Full Name"] || "Unknown";
            const email = row.email || row.Email || row["Email Address"] || "";
            const category = row.category || row.Category || row.group || row.Group || "";
            const year = row.year || row.Year || row.batch || row.Batch || "";
            const status = row.status || row.Status || "Active";

            return {
                id: Date.now() + index,
                name: String(name),
                email: String(email),
                category: String(category),
                year: String(year),
                status: String(status),
            };
        });

        setUsers((prev) => [...prev, ...nextUsers]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <div className="flex gap-2">
                    <ExcelImporter onImport={handleImport} />
                    <button
                        onClick={() => navigate("/admin/users/create")}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                    >
                        <UserPlus size={16} /> Add User
                    </button>
                </div>
            </div>

            {/* Filters Area (SRS Page 55) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by name, email..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 ring-purple-500/20" />
                </div>
                <select className="border rounded-lg px-4 py-2 text-sm outline-none"><option>All Years</option></select>
                <select className="border rounded-lg px-4 py-2 text-sm outline-none"><option>All Categories</option></select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Year</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{user.category}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">Year {user.year}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-purple-600 font-medium text-sm">View Profile</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersModule;