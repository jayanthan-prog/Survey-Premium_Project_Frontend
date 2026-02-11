import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import BasicGroupInfo from "../components/BasicGroupInfo";
import TaskSection from "../components/TaskSection";
import UserListInput from "../components/UserListInput";

const API_BASE = "http://localhost:4000/api";

const GroupBuilderPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [groupName, setGroupName] = useState("");
    const [desc, setDesc] = useState("");
    const [category, setCategory] = useState("");

    const [approvers, setApprovers] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [task, setTask] = useState("");

    const [categories, setCategories] = useState([
        "Placement",
        "Academic",
        "Special Lab",
        "Training"
    ]);

    const [newCategory, setNewCategory] = useState("");

    const addCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            setCategories([...categories, newCategory]);
            setNewCategory("");
        }
    };

    // Fetch users and their roles
    const [allUsers, setAllUsers] = useState([]);
    const [approverUsers, setApproverUsers] = useState([]);
    const [participantUsers, setParticipantUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch users
                const usersResponse = await fetch(`${API_BASE}/users`);
                const usersData = await usersResponse.json();
                const users = usersData.data || usersData;
                
                console.log("Users fetched:", users.length);
                console.log("Sample user:", users[0]);

                // Fetch user roles
                const rolesResponse = await fetch(`${API_BASE}/user-roles`);
                const rolesData = await rolesResponse.json();
                const roles = rolesData.data || rolesData;
                
                console.log("Roles fetched:", roles.length);
                console.log("Sample role:", roles[0]);

                // Create a map of user_id to role (use lowercase for case-insensitive comparison)
                const userRoleMap = {};
                roles.forEach(role => {
                    if (role.user_id) {
                        // Store with lowercase key for matching
                        const key = role.user_id.toLowerCase();
                        userRoleMap[key] = role.role;
                    }
                });

                console.log("User role map:", userRoleMap);

                // Separate users by role
                const approvers = [];
                const participants = [];

                users.forEach(user => {
                    const userId = user.user_id || user.id;
                    const userIdLower = userId ? userId.toLowerCase() : null;
                    const userRole = userIdLower ? (userRoleMap[userIdLower] || 'USER') : 'USER';
                    
                    const userWithRole = {
                        ...user,
                        user_id: userId,
                        role: userRole
                    };

                    if (userRole === 'APPROVER') {
                        approvers.push(userWithRole);
                    } else {
                        participants.push(userWithRole);
                    }
                });

                console.log("Approvers found:", approvers.length);
                console.log("Participants found:", participants.length);

                setAllUsers(users);
                setApproverUsers(approvers);
                setParticipantUsers(participants);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    const getUserId = (user) => {
        // Handle different user object formats
        return user?.user_id || user?.id || user?.userId || null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!groupName) {
            toast.error("Group name is required");
            return;
        }

        setLoading(true);

        try {
            // Combine approvers and participants into one memberIds array
            const approverIds = approvers
                .map(getUserId)
                .filter(id => id !== null);
            const participantIds = participants
                .map(getUserId)
                .filter(id => id !== null);
            const memberIds = [...approverIds, ...participantIds];

            // Validate member IDs
            if (memberIds.length === 0) {
                toast.error("Please add at least one member to the group");
                setLoading(false);
                return;
            }

            console.log("Creating group with members:", { name: groupName, memberIds });

            // Create group with members in one request
            const groupResponse = await fetch(`${API_BASE}/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: groupName,
                    description: desc,
                    memberIds: memberIds,
                }),
            });

            const groupData = await groupResponse.json();

            if (!groupResponse.ok) {
                toast.error(groupData.message || "Failed to create group");
                setLoading(false);
                return;
            }

            toast.success("Group created successfully");
            navigate("/admin/groups");
        } catch (error) {
            console.error("Error creating group:", error);
            toast.error("An error occurred while creating group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 ">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Create Group</h1>
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
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Group"}
                    </button>
                </div>
            </div>

            <form className="space-y-6">
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

                {/* APPROVERS - Only show users with APPROVER role */}
                <UserListInput
                    label="Assign Approvers"
                    items={approvers}
                    setItems={setApprovers}
                    availableUsers={approverUsers}
                />

                {/* PARTICIPANTS - Show all other users */}
                <UserListInput
                    label="Add Participants"
                    items={participants}
                    setItems={setParticipants}
                    availableUsers={participantUsers}
                />

                {/* TASK */}
                <TaskSection task={task} setTask={setTask} />
            </form>
        </div>
    );
};

export default GroupBuilderPage;
