import { useState, useEffect } from "react";
import { Search, RefreshCw, Snowflake, CheckCircle, UserPlus } from "lucide-react";
import ExcelImporter from "../groups/components/ExcelImporter";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:4000/api";

const UsersModule = () => {
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    // Fetch users and roles from API
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch users
            const usersResponse = await fetch(`${API_BASE}/users`);
            if (!usersResponse.ok) throw new Error("Failed to fetch users");
            const usersResponseData = await usersResponse.json();
            const usersData = usersResponseData.data || usersResponseData;

            // Fetch all user roles
            const rolesResponse = await fetch(`${API_BASE}/user-roles`);
            if (!rolesResponse.ok) throw new Error("Failed to fetch user roles");
            const rolesResponseData = await rolesResponse.json();
            const rolesData = rolesResponseData.data || rolesResponseData;

            setUsers(usersData);
            setUserRoles(rolesData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Get role for a user
    const getUserRole = (userId) => {
        const userRole = userRoles.find(ur => ur.user_id === userId);
        return userRole ? userRole.role : "USER";
    };

    // Get all unique roles
    const allRoles = ["ALL", ...new Set(userRoles.map(ur => ur.role))];

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const userRole = getUserRole(user.user_id || user.id);
        const matchesRole = roleFilter === "ALL" || userRole === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Freeze/Unfreeze user
    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
        const actionText = newStatus === 'FROZEN' ? 'freezing' : 'activating';
        
        try {
            const response = await fetch(`${API_BASE}/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`User ${actionText}d successfully`);
                
                // If freezing a user and they are currently logged in, log them out
                if (data.frozen && currentUser?.id === userId) {
                    logout();
                    navigate('/login');
                    toast.error("Your account has been frozen");
                }
                
                fetchData(); // Refresh data
            } else {
                toast.error(data.message || `Failed to ${actionText} user`);
            }
        } catch (err) {
            toast.error(`Error ${actionText} user`);
        }
    };

    const handleImport = (rows) => {
        if (!Array.isArray(rows) || rows.length === 0) {
            return;
        }

        const nextUsers = rows.map((row, index) => {
            const name = row.name || row.fullName || row.Name || row["Full Name"] || "Unknown";
            const email = row.email || row.Email || row["Email Address"] || "";

            return {
                id: Date.now() + index,
                name: String(name),
                email: String(email),
            };
        });

        setUsers((prev) => [...prev, ...nextUsers]);
    };

    // Role badge colors
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "ADMIN":
                return "bg-purple-100 text-purple-700";
            case "APPROVER":
                return "bg-blue-100 text-blue-700";
            case "USER":
                return "bg-green-100 text-green-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-200"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <ExcelImporter onImport={handleImport} />
                    <button
                        onClick={() => navigate("/admin/users/create")}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-purple-700"
                    >
                        <UserPlus size={16} /> Add User
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 ring-purple-500/20"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 ring-purple-500/20"
                >
                    {allRoles.map(role => (
                        <option key={role} value={role}>
                            {role === "ALL" ? "All Roles" : role}
                        </option>
                    ))}
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Freeze</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.user_id || user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{user.name || "Unknown"}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRoleBadgeColor(getUserRole(user.user_id || user.id))}`}>
                                            {getUserRole(user.user_id || user.id)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleUserStatus(user.user_id || user.id, user.status)}
                                            className={`p-2 rounded-lg transition-colors inline-flex ${
                                                user.status === 'FROZEN' 
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                            }`}
                                            title={user.status === 'FROZEN' ? "Activate User" : "Freeze User"}
                                        >
                                            {user.status === 'FROZEN' ? (
                                                <CheckCircle size={18} />
                                            ) : (
                                                <Snowflake size={18} />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
            </div>
        </div>
    );
};

export default UsersModule;
