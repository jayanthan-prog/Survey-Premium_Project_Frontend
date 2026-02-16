import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserListInput from "../../groups/components/UserListInput";

const AllocationAddPage = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [allocationType, setAllocationType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [location, setLocation] = useState("");
    const [instructions, setInstructions] = useState("");
    const [notes, setNotes] = useState("");
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);

    const inputClassName =
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            title,
            type: allocationType,
            startDate,
            endDate,
            location,
            instructions,
            notes,
            teachers,
            students,
        };

        console.log("Create allocation", payload);
        navigate("/admin/allocation");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Add Allocation</h1>
                    <div className="text-sm text-gray-500">Set tasks, dates, and assign teachers and students.</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/allocation")}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="allocation-add-form"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        Save Allocation
                    </button>
                </div>
            </div>

            <form id="allocation-add-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                            <h2 className="text-sm font-semibold text-gray-800">Allocation Details</h2>
                            <div>
                                <label className={labelClassName}>Title</label>
                                <input
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Mock Interview"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Allocation Type</label>
                                <select
                                    value={allocationType}
                                    onChange={(event) => setAllocationType(event.target.value)}
                                    className={inputClassName}
                                    required
                                >
                                    <option value="">Select type</option>
                                    <option value="Task">Task</option>
                                    <option value="Practical">Practical</option>
                                    <option value="Assessment">Assessment</option>
                                    <option value="Mock Interview">Mock Interview</option>
                                    <option value="Review Session">Review Session</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClassName}>Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(event) => setStartDate(event.target.value)}
                                        className={inputClassName}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(event) => setEndDate(event.target.value)}
                                        className={inputClassName}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClassName}>Location / Mode</label>
                                <input
                                    value={location}
                                    onChange={(event) => setLocation(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Lab 2 / Online"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Instructions</label>
                                <textarea
                                    value={instructions}
                                    onChange={(event) => setInstructions(event.target.value)}
                                    className={inputClassName}
                                    rows="3"
                                    placeholder="Describe tasks or expectations"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Additional Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    className={inputClassName}
                                    rows="2"
                                    placeholder="Any other details"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <UserListInput
                            label="Assign Teachers (Approvers)"
                            items={teachers}
                            setItems={setTeachers}
                            placeholder="Type teacher name and press Enter..."
                        />
                        <UserListInput
                            label="Assign Students"
                            items={students}
                            setItems={setStudents}
                            placeholder="Type student name and press Enter..."
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AllocationAddPage;
