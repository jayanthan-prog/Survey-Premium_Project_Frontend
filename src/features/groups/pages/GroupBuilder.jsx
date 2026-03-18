import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BasicGroupInfo from "../components/BasicGroupInfo";
import TaskSection from "../components/TaskSection";
import UserListInput from "../components/UserListInput";
import { useAuth } from "../../../context/AuthContext";
import { listUsers } from "../../../services/userService";
import { createGroup, getGroup, listGroups, updateGroup } from "../../../services/groupService";

const GroupBuilderPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { token, user } = useAuth();

    const isEditMode = Boolean(id);

    const [groupName, setGroupName] = useState("");
    const [desc, setDesc] = useState("");
    const [category, setCategory] = useState("");
    const [task, setTask] = useState("");

    const [approvers, setApprovers] = useState([]);
    const [participants, setParticipants] = useState([]);

    const [categories, setCategories] = useState([
        "Placement",
        "Academic",
        "Special Lab",
        "Training"
    ]);

    const [newCategory, setNewCategory] = useState("");
    const [directoryUsers, setDirectoryUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const addCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            setCategories([...categories, newCategory]);
            setNewCategory("");
        }
    };

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!token) {
                if (active) {
                    setLoading(false);
                    setError("Missing auth token");
                }
                return;
            }

            try {
                const [usersResponse, groupsResponse, groupResponse] = await Promise.all([
                    listUsers(token),
                    listGroups(token),
                    isEditMode ? getGroup(token, id) : Promise.resolve(null),
                ]);

                if (!active) return;

                const nextUsers = Array.isArray(usersResponse) ? usersResponse : [];
                setDirectoryUsers(nextUsers);

                const nextCategories = new Set(categories);
                (Array.isArray(groupsResponse) ? groupsResponse : []).forEach((group) => {
                    if (group?.type) {
                        nextCategories.add(group.type);
                    }
                });

                if (groupResponse?.type) {
                    nextCategories.add(groupResponse.type);
                }

                setCategories(Array.from(nextCategories));

                if (groupResponse) {
                    setGroupName(groupResponse.name || "");
                    setDesc(groupResponse.description || "");
                    setCategory(groupResponse.type || "");
                    setTask(groupResponse.task || "");
                    setApprovers((groupResponse.approvers || []).map((member) => member.email || member.name).filter(Boolean));
                    setParticipants((groupResponse.participants || []).map((member) => member.email || member.name).filter(Boolean));
                }
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load group form.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [token, id, isEditMode]);

    const directoryLookup = useMemo(() => {
        const byKey = new Map();

        for (const entry of directoryUsers) {
            const keys = [
                entry?.email,
                entry?.name,
                entry?.user_id,
                entry?.email ? `${entry.name} <${entry.email}>` : null,
            ];

            keys
                .filter(Boolean)
                .forEach((key) => byKey.set(String(key).trim().toLowerCase(), entry));
        }

        return byKey;
    }, [directoryUsers]);


    const resolveUserIds = (values, label) => {
        const resolved = [];
        const missing = [];

        for (const value of values) {
            const match = directoryLookup.get(String(value || "").trim().toLowerCase());
            if (!match) {
                missing.push(value);
                continue;
            }
            resolved.push(Number(match.user_id));
        }

        if (missing.length) {
            throw new Error(`${label} not found in user directory: ${missing.join(", ")}`);
        }

        return Array.from(new Set(resolved));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setError("Missing auth token");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                name: groupName.trim(),
                type: category || null,
                description: desc.trim(),
                task: task.trim(),
                created_by_name: user?.name || null,
                approver_user_ids: resolveUserIds(approvers, "Approver"),
                participant_user_ids: resolveUserIds(participants, "Participant"),
            };

            if (isEditMode) {
                await updateGroup(token, id, payload);
            } else {
                await createGroup(token, payload);
            }

            navigate(user?.role === "APPROVER" ? "/approver/groups" : "/admin/groups");
        } catch (err) {
            setError(err?.message || "Failed to save group.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 ">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{isEditMode ? "Edit Group" : "Create Group"}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="group-builder-form"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                        disabled={saving || loading}
                    >
                        {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create Group"}
                    </button>
                </div>
            </div>

            {loading && <div className="text-sm text-gray-500">Loading group form...</div>}
            {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <form id="group-builder-form" onSubmit={handleSubmit} className="space-y-6">
                {/* BASIC INFO */}
                <BasicGroupInfo
                    groupName={groupName}
                    setGroupName={setGroupName}
                    desc={desc}
                    setDesc={setDesc}
                    category={category}
                    setCategory={setCategory}
                    categories={categories}
                    newCategory={newCategory}
                    setNewCategory={setNewCategory}
                    addCategory={addCategory}
                />

                {/* APPROVERS */}
                <UserListInput
                    label="Assign Approvers"
                    items={approvers}
                    setItems={setApprovers}
                    options={directoryUsers.map((entry) => ({
                        value: entry.email || entry.name,
                        label: entry.email ? `${entry.name} <${entry.email}>` : entry.name,
                    }))}
                    placeholder="Type approver email or name and press Enter..."
                />

                {/* PARTICIPANTS */}
                <UserListInput
                    label="Add Participants"
                    items={participants}
                    setItems={setParticipants}
                    options={directoryUsers.map((entry) => ({
                        value: entry.email || entry.name,
                        label: entry.email ? `${entry.name} <${entry.email}>` : entry.name,
                    }))}
                    placeholder="Type participant email or name and press Enter..."
                />

                {/* TASK */}
                <TaskSection task={task} setTask={setTask} />
            </form>
        </div>
    );
};

export default GroupBuilderPage;
