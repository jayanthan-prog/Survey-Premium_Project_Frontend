import { Activity, ArrowLeft, BadgeCheck, BookOpen, CalendarDays, Mail, Phone, ShieldCheck, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useConfirmation } from "../../../context/ConfirmationContext";
import {
    assignUserRole,
    getAvailableRoles,
    getUserProfile,
    removeUserRole,
    updateUser,
} from "../../../services/userService";

function formatDateTime(value) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString();
}

function DetailCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-2 text-sm font-medium text-slate-800 break-words">{value || "-"}</div>
        </div>
    );
}

const metricCards = [
    { key: "sign_in_count", label: "Sign-ins", icon: ShieldCheck, tone: "bg-purple-50 text-purple-600" },
    { key: "active_sessions", label: "Active Sessions", icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-600" },
    { key: "survey_participations", label: "Survey Records", icon: BookOpen, tone: "bg-blue-50 text-blue-600" },
    { key: "answers_submitted", label: "Answers Submitted", icon: Activity, tone: "bg-amber-50 text-amber-600" },
];

const UserProfilePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { token, user: currentUser } = useAuth();
    const { confirm } = useConfirmation();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        category: "",
        department: "",
        year: "",
        section: "",
        rank: "",
        score: "",
        is_active: true,
    });

    const [availableRoles, setAvailableRoles] = useState([]);
    const [roleToAdd, setRoleToAdd] = useState("");
    const [roleBusy, setRoleBusy] = useState(false);

    const roleBasePath = currentUser?.role === "APPROVER" ? "/approver" : "/admin";
    const canEdit = currentUser?.role === "ADMIN";

    const loadProfile = async () => {
        if (!token || !id) {
            setLoading(false);
            setError("Missing user session or user id.");
            return;
        }

        const response = await getUserProfile(token, id);
        setProfileData(response);

        const user = response?.user || {};
        setEditForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            category: user.category || "",
            department: user.department || "",
            year: user.year ?? "",
            section: user.section || "",
            rank: user.rank ?? "",
            score: user.score ?? "",
            is_active: Boolean(user.is_active),
        });
    };

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (Number(currentUser?.user_id) === Number(id)) {
                if (active) {
                    navigate(`${roleBasePath}/users`, { replace: true });
                }
                return;
            }

            try {
                await loadProfile();

                if (canEdit) {
                    const rolesResponse = await getAvailableRoles(token);
                    const roleRows = Array.isArray(rolesResponse)
                        ? rolesResponse
                        : (Array.isArray(rolesResponse?.data) ? rolesResponse.data : []);
                    const names = roleRows
                        .map((row) => String(row?.name || "").trim().toUpperCase())
                        .filter(Boolean);

                    if (active) {
                        const coreRoles = ["ADMIN", "APPROVER", "USER"];
                        setAvailableRoles([...new Set([...coreRoles, ...names])]);
                    }
                }

                if (!active) return;
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load user profile.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [token, id, currentUser?.user_id, navigate, roleBasePath, canEdit]);

    const profile = profileData?.user || {};
    const summary = profileData?.summary || {};
    const activity = profileData?.activity || [];
    const roles = Array.isArray(profile.roles) ? profile.roles : [];

    const addableRoles = availableRoles.filter((role) => !roles.includes(role));

    const handleFieldChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError("");
            setSaveMessage("");

            const payload = {
                name: editForm.name.trim(),
                phone: editForm.phone.trim() || null,
                category: editForm.category.trim() || null,
                department: editForm.department.trim() || null,
                year: editForm.year === "" ? null : Number(editForm.year),
                section: editForm.section.trim() || null,
                rank: editForm.rank === "" ? null : Number(editForm.rank),
                score: editForm.score === "" ? null : Number(editForm.score),
                is_active: Boolean(editForm.is_active),
            };

            await updateUser(token, id, payload);
            await loadProfile();
            setEditMode(false);
            setSaveMessage("User profile updated successfully.");
        } catch (err) {
            setError(err?.message || "Failed to update user profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddRole = async () => {
        if (!roleToAdd) return;
        try {
            setRoleBusy(true);
            setError("");
            setSaveMessage("");
            await assignUserRole(token, id, roleToAdd);
            await loadProfile();
            setRoleToAdd("");
            setSaveMessage(`Role ${roleToAdd} assigned.`);
        } catch (err) {
            setError(err?.message || "Failed to assign role.");
        } finally {
            setRoleBusy(false);
        }
    };

    const handleRemoveRole = async (roleName) => {
        const approved = await confirm({
            title: "Remove Role",
            message: `Remove role ${roleName} from this user?`,
            confirmText: "Remove",
            tone: "warning",
        });
        if (!approved) return;

        try {
            setRoleBusy(true);
            setError("");
            setSaveMessage("");
            await removeUserRole(token, id, roleName);
            await loadProfile();
            setSaveMessage(`Role ${roleName} removed.`);
        } catch (err) {
            setError(err?.message || "Failed to remove role.");
        } finally {
            setRoleBusy(false);
        }
    };

    const handleSetPrimaryRole = async (nextRole) => {
        try {
            setRoleBusy(true);
            setError("");
            setSaveMessage("");

            const currentRoles = Array.isArray(profile.roles) ? [...profile.roles] : [];

            for (const roleName of currentRoles) {
                if (roleName !== nextRole) {
                    await removeUserRole(token, id, roleName);
                }
            }

            if (!currentRoles.includes(nextRole)) {
                await assignUserRole(token, id, nextRole);
            }

            await loadProfile();
            setSaveMessage(`Primary login role set to ${nextRole}.`);
        } catch (err) {
            setError(err?.message || "Failed to set primary role.");
        } finally {
            setRoleBusy(false);
        }
    };

    const detailCards = useMemo(() => ([
        { label: "Full Name", value: profile.name },
        { label: "Email", value: profile.email },
        { label: "Phone", value: profile.phone },
        { label: "Primary Role", value: profile.role },
        { label: "All Roles", value: Array.isArray(profile.roles) && profile.roles.length ? profile.roles.join(", ") : "-" },
        { label: "Gender", value: profile.category },
        { label: "Department", value: profile.department },
        { label: "Year", value: profile.year ? `Year ${profile.year}` : "-" },
        { label: "Section", value: profile.section },
        { label: "Rank", value: profile.rank },
        { label: "Score", value: profile.score },
        { label: "Status", value: profile.is_active ? "Active" : "Inactive" },
        { label: "Created At", value: formatDateTime(profile.created_at) },
        { label: "Last Updated", value: formatDateTime(profile.updated_at) },
    ]), [profile]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(`${roleBasePath}/users`)}
                        className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-purple-200 hover:text-purple-700"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{profile.name || "User details"}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2"><Mail size={14} /> {profile.email || "No email"}</span>
                            <span className="inline-flex items-center gap-2"><Phone size={14} /> {profile.phone || "No phone"}</span>
                            <span className="inline-flex items-center gap-2"><UserCircle2 size={14} /> {profile.role || "No role"}</span>
                        </div>
                    </div>
                </div>
                <div className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${profile.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {profile.is_active ? "Active access" : "Access disabled"}
                </div>
            </div>

            {loading && <div className="text-sm text-slate-500">Loading profile...</div>}
            {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {!error && saveMessage && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveMessage}</div>}

            {!loading && !error && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {metricCards.map(({ key, label, icon: Icon, tone }) => (
                            <div key={key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="text-3xl font-semibold tracking-tight text-slate-900">{summary[key] ?? 0}</div>
                                </div>
                                <div className="mt-4 text-sm font-medium text-slate-500">{label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Complete Profile</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canEdit && !editMode && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditMode(true);
                                                setSaveMessage("");
                                            }}
                                            className="rounded-xl border border-purple-200 bg-purple-500 px-3 py-2 text-xs font-medium text-purple-50 hover:bg-purple-100"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                    {canEdit && editMode && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-60"
                                            >
                                                {saving ? "Saving..." : "Save Changes"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditMode(false);
                                                    setEditForm({
                                                        name: profile.name || "",
                                                        email: profile.email || "",
                                                        phone: profile.phone || "",
                                                        category: profile.category || "",
                                                        department: profile.department || "",
                                                        year: profile.year ?? "",
                                                        section: profile.section || "",
                                                        rank: profile.rank ?? "",
                                                        score: profile.score ?? "",
                                                        is_active: Boolean(profile.is_active),
                                                    });
                                                }}
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                        <CalendarDays size={14} /> Joined {formatDateTime(profile.created_at)}
                                    </div>
                                </div>
                            </div>
                            {editMode ? (
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Full Name</span>
                                        <input value={editForm.name} onChange={(e) => handleFieldChange("name", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Email</span>
                                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{profile.email || "-"}</div>
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Phone</span>
                                        <input value={editForm.phone} onChange={(e) => handleFieldChange("phone", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Department</span>
                                        <input value={editForm.department} onChange={(e) => handleFieldChange("department", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Gender</span>
                                        <input value={editForm.category} onChange={(e) => handleFieldChange("category", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Year</span>
                                        <input type="number" value={editForm.year} onChange={(e) => handleFieldChange("year", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Section</span>
                                        <input value={editForm.section} onChange={(e) => handleFieldChange("section", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Rank</span>
                                        <input type="number" value={editForm.rank} onChange={(e) => handleFieldChange("rank", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs text-slate-500">Score</span>
                                        <input type="number" value={editForm.score} onChange={(e) => handleFieldChange("score", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                                    </label>
                                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={editForm.is_active} onChange={(e) => handleFieldChange("is_active", e.target.checked)} />
                                        Active account
                                    </label>
                                </div>
                            ) : (
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    {detailCards.map((item) => (
                                        <DetailCard key={item.label} label={item.label} value={item.value} />
                                    ))}
                                </div>
                            )}

                            {canEdit && (
                                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                                    <h3 className="text-sm font-semibold text-slate-900">Role Management</h3>
                                    <p className="mt-1 text-xs text-slate-500">Assign/remove roles and set the primary login role.</p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {roles.map((roleName) => (
                                            <div key={roleName} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                                                {roleName}
                                                <button
                                                    type="button"
                                                    disabled={roleBusy || roles.length <= 1}
                                                    onClick={() => handleRemoveRole(roleName)}
                                                    className="text-rose-600 disabled:opacity-40"
                                                    title={roles.length <= 1 ? "At least one role is required" : "Remove role"}
                                                >
                                                    x
                                                </button>
                                            </div>
                                        ))}
                                        {!roles.length && <span className="text-xs text-slate-400">No roles assigned.</span>}
                                    </div>

                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="text-xs text-slate-500">Add Role</div>
                                            <div className="flex gap-2">
                                                <select
                                                    value={roleToAdd}
                                                    onChange={(e) => setRoleToAdd(e.target.value)}
                                                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                                >
                                                    <option value="">Select role</option>
                                                    {addableRoles.map((roleName) => (
                                                        <option key={roleName} value={roleName}>{roleName}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    disabled={roleBusy || !roleToAdd}
                                                    onClick={handleAddRole}
                                                    className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-60"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-xs text-slate-500">Primary Login Role</div>
                                            <select
                                                value={profile.role || ""}
                                                onChange={(e) => handleSetPrimaryRole(e.target.value)}
                                                disabled={roleBusy || !roles.length}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:opacity-60"
                                            >
                                                <option value="" disabled>Select primary role</option>
                                                {roles.map((roleName) => (
                                                    <option key={roleName} value={roleName}>{roleName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Attributes</div>
                                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-slate-700">{JSON.stringify(profile.attributes || {}, null, 2)}</pre>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Recent Activities</h2>
                                <p className="mt-1 text-sm text-slate-500">Latest sign-ins, audit entries, and survey actions related to this user.</p>
                            </div>
                            <div className="mt-6 space-y-4">
                                {activity.map((item, index) => (
                                    <div key={`${item.type}-${item.reference_id || index}`} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-xs font-medium uppercase tracking-[0.2em] text-purple-500">{item.type.replaceAll("_", " ")}</div>
                                                <div className="mt-1 text-sm font-semibold text-slate-900">{item.title}</div>
                                                <div className="mt-1 text-sm leading-6 text-slate-600">{item.description}</div>
                                            </div>
                                            <div className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(item.occurred_at)}</div>
                                        </div>
                                    </div>
                                ))}
                                {!activity.length && (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                        No recent activity found for this user.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserProfilePage;