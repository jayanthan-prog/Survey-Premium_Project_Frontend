import { useEffect, useMemo, useState } from "react";
import { Check, Lock, LockOpen, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";
import ExcelImporter from "../groups/components/ExcelImporter";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import { createUser, deleteUser, listUsers, updateUser } from "../../services/userService";

const PAGE_SIZES = [10, 15, 25];

const UsersModule = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const { confirm } = useConfirmation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchText, setSearchText] = useState("");
    const [yearFilter, setYearFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState({});
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const roleBasePath = user?.role === "APPROVER" ? "/approver" : "/admin";

    const loadUsers = async () => {
        if (!token) {
            setLoading(false);
            setError("Missing auth token");
            return;
        }

        try {
            setLoading(true);
            const response = await listUsers(token, { includeInactive: true });
            setUsers(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err?.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [token]);

    const handleImport = (rows) => {
        if (!Array.isArray(rows) || rows.length === 0) {
            return;
        }

        const nextUsers = rows.map((row) => {
            const name = row.name || row.fullName || row.Name || row["Full Name"] || "Unknown";
            const email = row.email || row.Email || row["Email Address"] || "";
            const category = row.category || row.Category || row.group || row.Group || "";
            const year = row.year || row.Year || row.batch || row.Batch || "";
            const status = row.status || row.Status || "Active";

            return {
                name: String(name),
                email: String(email),
                category: String(category),
                year: year ? Number(year) : null,
                is_active: String(status).toLowerCase() !== "inactive",
                attributes: {},
            };
        });

        const createImported = async () => {
            try {
                for (const payload of nextUsers) {
                    await createUser(token, payload);
                }
            } catch (err) {
                setError(err?.message || "Failed to import some users.");
            } finally {
                loadUsers();
            }
        };

        createImported();
    };

    const uniqueYears = useMemo(() => {
        const years = new Set(users.map((item) => item.year).filter((v) => v !== null && v !== undefined));
        return Array.from(years).sort((a, b) => Number(a) - Number(b));
    }, [users]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set(users.map((item) => item.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [users]);

    const filteredUsers = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return users.filter((item) => {
            const isCurrentUser = Number(item.user_id) === Number(user?.user_id);
            const matchesQuery = !query || String(item.name || "").toLowerCase().includes(query) || String(item.email || "").toLowerCase().includes(query);
            const matchesYear = yearFilter === "ALL" || String(item.year || "") === String(yearFilter);
            const matchesCategory = categoryFilter === "ALL" || String(item.category || "") === String(categoryFilter);
            return !isCurrentUser && matchesQuery && matchesYear && matchesCategory;
        });
    }, [users, searchText, yearFilter, categoryFilter, user?.user_id]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, yearFilter, categoryFilter, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredUsers.slice(startIndex, startIndex + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    const pageRangeStart = filteredUsers.length ? (currentPage - 1) * pageSize + 1 : 0;
    const pageRangeEnd = Math.min(currentPage * pageSize, filteredUsers.length);

    const beginEdit = (row) => {
        setEditingId(row.user_id);
        setEditDraft({
            name: row.name || "",
            category: row.category || "",
            year: row.year || "",
            is_active: Boolean(row.is_active),
        });
    };

    const saveEdit = async (userId) => {
        try {
            await updateUser(token, userId, {
                name: editDraft.name,
                category: editDraft.category || null,
                year: editDraft.year === "" ? null : Number(editDraft.year),
                is_active: Boolean(editDraft.is_active),
            });
            setEditingId(null);
            await loadUsers();
        } catch (err) {
            setError(err?.message || "Failed to update user.");
        }
    };

    const removeUser = async (userId) => {
        try {
            await deleteUser(token, userId);
            await loadUsers();
        } catch (err) {
            setError(err?.message || "Failed to delete user.");
        }
    };

    const toggleUserFreeze = async (row) => {
        const approved = await confirm({
            title: row.is_active ? "Freeze User" : "Enable User",
            message: row.is_active
                ? "Are you sure you want to freeze this user account?"
                : "Are you sure you want to enable this user account?",
            confirmText: row.is_active ? "Freeze" : "Enable",
            tone: "warning",
        });
        if (!approved) return;

        try {
            setError("");
            await updateUser(token, row.user_id, { is_active: !row.is_active });
            await loadUsers();
        } catch (err) {
            setError(err?.message || `Failed to ${row.is_active ? "freeze" : "enable"} user.`);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                    <div className="flex flex-wrap gap-2">
                        <ExcelImporter onImport={handleImport} />
                        <button
                            onClick={() => navigate(`${roleBasePath}/users/create`)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                        >
                            <UserPlus size={16} /> Add User
                        </button>
                    </div>
                </div>

                {loading && <div className="text-sm text-gray-500">Loading users...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}

                {/* Filters Area (SRS Page 55) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input value={searchText} onChange={(e) => setSearchText(e.target.value)} type="text" placeholder="Search by name, email..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 ring-purple-500/20" />
                    </div>
                    <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border rounded-lg px-4 py-2 text-sm outline-none"><option value="ALL">All Years</option>{uniqueYears.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded-lg px-4 py-2 text-sm outline-none"><option value="ALL">All Categories</option>{uniqueCategories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                </div>

                {/* Users Table + Pagination */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden  flex flex-col">
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                            <thead className="bg-gray-50 border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Year</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedUsers.map(user => (
                                    <tr
                                        key={user.user_id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            if (editingId !== user.user_id) {
                                                navigate(`${roleBasePath}/users/${user.user_id}`);
                                            }
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            {editingId === user.user_id ? (
                                                <div className="space-y-2">
                                                    <input className="w-full border rounded px-2 py-1 text-sm" value={editDraft.name || ""} onClick={(event) => event.stopPropagation()} onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))} />
                                                    <div className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">{user.email}</div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {editingId === user.user_id ? (
                                                <input className="w-28 border rounded px-2 py-1 text-sm" value={editDraft.category || ""} onClick={(event) => event.stopPropagation()} onChange={(e) => setEditDraft((prev) => ({ ...prev, category: e.target.value }))} />
                                            ) : (
                                                user.category || "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {editingId === user.user_id ? (
                                                <input className="w-20 border rounded px-2 py-1 text-sm" value={editDraft.year ?? ""} onClick={(event) => event.stopPropagation()} onChange={(e) => setEditDraft((prev) => ({ ...prev, year: e.target.value }))} />
                                            ) : (
                                                user.year ? `Year ${user.year}` : "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === user.user_id ? (
                                                <label className="inline-flex items-center gap-3 text-xs font-medium text-gray-700">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setEditDraft((prev) => ({ ...prev, is_active: !prev.is_active }));
                                                        }}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editDraft.is_active ? "bg-purple-600" : "bg-gray-200"}`}
                                                        aria-pressed={Boolean(editDraft.is_active)}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editDraft.is_active ? "translate-x-6" : "translate-x-1"}`}
                                                        />
                                                    </button>
                                                    Active
                                                </label>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {user.is_active ? "Active" : "Inactive"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            {editingId === user.user_id ? (
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={(event) => {
                                                        event.stopPropagation();
                                                        saveEdit(user.user_id);
                                                    }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100" aria-label="Save user">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={(event) => {
                                                        event.stopPropagation();
                                                        setEditingId(null);
                                                    }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Cancel edit">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={(event) => {
                                                        event.stopPropagation();
                                                        beginEdit(user);
                                                    }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100" aria-label="Edit user">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={(event) => {
                                                        event.stopPropagation();
                                                        toggleUserFreeze(user);
                                                    }} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${user.is_active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`} aria-label={user.is_active ? "Freeze user" : "Enable user"} title={user.is_active ? "Freeze user" : "Enable user"}>
                                                        {user.is_active ? <Lock size={16} /> : <LockOpen size={16} />}
                                                    </button>
                                                    <button onClick={async (event) => {
                                                        event.stopPropagation();
                                                        const approved = await confirm({
                                                            title: "Delete User",
                                                            message: "Are you sure you want to delete this user? This action cannot be undone.",
                                                            confirmText: "Delete",
                                                            tone: "danger",
                                                        });
                                                        if (!approved) return;
                                                        await removeUser(user.user_id);
                                                    }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100" aria-label="Delete user">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!filteredUsers.length && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-sm text-gray-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-100 flex flex-col gap-3 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="text-gray-600">
                            Showing {pageRangeStart}-{pageRangeEnd} of {filteredUsers.length} users
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-gray-500">Per page</label>
                            <select
                                value={pageSize}
                                onChange={(event) => setPageSize(Number(event.target.value))}
                                className="rounded-lg border border-gray-200 px-2 py-1 outline-none focus:ring-2 ring-purple-500/20"
                            >
                                {PAGE_SIZES.map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-200 px-3 py-1 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>

                            <span className="px-2 text-gray-600">Page {currentPage} of {totalPages}</span>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-gray-200 px-3 py-1 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default UsersModule;