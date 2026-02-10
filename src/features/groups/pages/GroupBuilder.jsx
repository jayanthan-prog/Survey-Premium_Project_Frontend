import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BasicGroupInfo from "../components/BasicGroupInfo";
import TaskSection from "../components/TaskSection";
import UserListInput from "../components/UserListInput";

const GroupBuilderPage = () => {
    const navigate = useNavigate();

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

    const addCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            setCategories([...categories, newCategory]);
            setNewCategory("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            groupName,
            desc,
            category,
            task,
            approvers,
            participants
        };

        console.log(payload);
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
                        type="submit"
                        form="group-builder-form"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        Create Group
                    </button>
                </div>
            </div>

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
                />

                {/* PARTICIPANTS */}
                <UserListInput
                    label="Add Participants"
                    items={participants}
                    setItems={setParticipants}
                />

                {/* TASK */}
                <TaskSection task={task} setTask={setTask} />
            </form>
        </div>
    );
};

export default GroupBuilderPage;
