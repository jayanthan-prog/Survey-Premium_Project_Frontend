import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Search, RefreshCw, Users } from "lucide-react";
import toast from 'react-hot-toast';

const API_BASE = "http://localhost:4000/api";

const GroupsModule = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/groups`);
            const data = await response.json();
            setGroups(data);
        } catch (error) {
            console.error("Error fetching groups:", error);
            toast.error("Failed to fetch groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const filteredGroups = groups.filter(group =>
        group.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow p-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">

                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        User Groups
                    </h2>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchGroups}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-200"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button
                        onClick={() =>
                            navigate(user?.role === "APPROVER" ? "/approver/groups/create" : "/admin/groups/create")
                        }
                        className="bg-purple-600 hover:bg-purple-700 
              text-white px-4 py-2 rounded-lg 
              text-sm font-medium transition"
                    >
                        + Create Group
                    </button>
                </div>

            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-72 pl-10 border border-gray-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">

                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-3 text-sm font-semibold text-gray-600">
                                    Group Name
                                </th>
                                <th className="py-3 text-sm font-semibold text-gray-600">
                                    Members
                                </th>
                                <th className="py-3 text-sm font-semibold text-gray-600">
                                    Created
                                </th>
                                <th className="py-3 text-sm font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredGroups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500">
                                        No groups found
                                    </td>
                                </tr>
                            ) : (
                                filteredGroups.map((group) => (
                                    <tr
                                        key={group.group_id}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="py-4 font-medium text-gray-700">
                                            {group.name}
                                        </td>

                                        <td className="py-4 text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Users size={16} />
                                                {group.memberCount || 0}
                                            </div>
                                        </td>

                                        <td className="py-4 text-gray-600">
                                            {group.created_at ? new Date(group.created_at).toLocaleDateString() : '-'}
                                        </td>

                                        <td className="py-4 flex gap-3 text-sm">
                                            <button className="text-purple-600 hover:underline">
                                                View
                                            </button>
                                            <button className="text-gray-600 hover:underline">
                                                Edit
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            )}

                        </tbody>
                    </table>

                </div>
            )}

        </div>
    );
};

export default GroupsModule;
