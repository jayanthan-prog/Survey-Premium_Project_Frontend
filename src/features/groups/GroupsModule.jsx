import { useEffect, useMemo, useState } from "react";
import { FolderPlus, Lock, LockOpen, Pencil, Search, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import { deleteGroup, listGroups, updateGroup } from "../../services/groupService";

const GroupsModule = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const { confirm } = useConfirmation();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [freezeToggleId, setFreezeToggleId] = useState(null);

    const roleBasePath = user?.role === "APPROVER" ? "/approver" : "/admin";

    const loadGroups = async () => {
        if (!token) {
            setLoading(false);
            setError("Missing auth token");
            return;
        }

        try {
            setLoading(true);
            const response = await listGroups(token, { includeInactive: true });
            setGroups(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err?.message || "Failed to load groups.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, [token]);

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        return groups.filter((group) => {
            if (!query) return true;
            return [group.name, group.type, group.created_by_name]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [groups, search]);

    const handleDeleteGroup = async (groupId) => {
        try {
            await deleteGroup(token, groupId);
            await loadGroups();
        } catch (err) {
            setError(err?.message || "Failed to delete group.");
        }
    };

    const handleToggleFreezeGroup = async (group) => {
        const approved = await confirm({
            title: group.is_active ? "Freeze Group" : "Unfreeze Group",
            message: group.is_active
                ? "Are you sure you want to freeze this group?"
                : "Are you sure you want to unfreeze this group?",
            confirmText: group.is_active ? "Freeze" : "Unfreeze",
            tone: "warning",
        });
        if (!approved) return;

        try {
            setFreezeToggleId(group.group_id);
            setError("");
            const newIsActive = !group.is_active;
            await updateGroup(token, group.group_id, { is_active: newIsActive });
            await loadGroups();
        } catch (err) {
            setError(err?.message || "Failed to update group.");
        } finally {
            setFreezeToggleId(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">User Groups</h2>
                    </div>

                    <button
                        onClick={() => navigate(`${roleBasePath}/groups/create`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                    >
                        <FolderPlus size={16} /> Create Group
                    </button>
                </div>

                {loading && <div className="text-sm text-gray-500">Loading groups...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            placeholder="Search groups by name, type, or creator..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden h-[calc(100vh-320px)] flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-gray-50 border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Group</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Members</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Created By</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Status</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredGroups.map((group) => (
                                    <tr key={group.group_id} className="transition hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{group.name}</div>
                                            <div className="mt-1 text-xs text-gray-500">{group.type || "General"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="inline-flex items-center gap-2">
                                                <Users size={16} className="text-purple-500" />
                                                <span>{group.member_count || 0}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                {group.approver_count || 0} approvers, {group.participant_count || 0} participants
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{group.created_by_name || "-"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${group.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                {group.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`${roleBasePath}/groups/${group.group_id}/edit`)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100"
                                                    aria-label="Edit group"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleFreezeGroup(group)}
                                                    disabled={freezeToggleId === group.group_id}
                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${group.is_active
                                                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                        } disabled:opacity-60`}
                                                    aria-label={group.is_active ? "Freeze group" : "Unfreeze group"}
                                                    title={group.is_active ? "Freeze group" : "Unfreeze group"}
                                                >
                                                    {freezeToggleId === group.group_id ? (
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    ) : group.is_active ? (
                                                        <Lock size={16} />
                                                    ) : (
                                                        <LockOpen size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const approved = await confirm({
                                                            title: "Delete Group",
                                                            message: `Are you sure you want to delete ${group.name}? This action cannot be undone.`,
                                                            confirmText: "Delete",
                                                            tone: "danger",
                                                        });
                                                        if (!approved) return;
                                                        await handleDeleteGroup(group.group_id);
                                                    }}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                                                    aria-label="Delete group"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filteredGroups.length && !loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-sm text-gray-500">No groups found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </>
    );
};

export default GroupsModule;
