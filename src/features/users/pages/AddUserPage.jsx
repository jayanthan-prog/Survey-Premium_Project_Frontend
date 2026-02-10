import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddUserPage = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [category, setCategory] = useState("");
    const [year, setYear] = useState("");
    const [section, setSection] = useState("");
    const [department, setDepartment] = useState("");
    const [rank, setRank] = useState("");
    const [score, setScore] = useState("");
    const [attributes, setAttributes] = useState("{}");

    const inputClassName =
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    const handleSubmit = (event) => {
        event.preventDefault();

        let parsedAttributes = attributes;
        try {
            parsedAttributes = JSON.parse(attributes);
        } catch {
            parsedAttributes = attributes;
        }

        const payload = {
            name,
            email,
            phone: phone || null,
            is_active: isActive,
            category,
            year: year || null,
            section: section || null,
            department: department || null,
            rank: rank ? Number(rank) : null,
            score: score ? Number(score) : null,
            attributes: parsedAttributes,
        };

        console.log("Create user", payload);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Add User</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/users")}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-user-form"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        Save User
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <form id="add-user-form" onSubmit={handleSubmit} className="h-full overflow-y-auto space-y-6 pr-2">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                        <h2 className="text-sm font-semibold text-gray-800">User Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClassName}>Name</label>
                                <input
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className={inputClassName}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className={inputClassName}
                                    placeholder="john@edu.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Phone</label>
                                <input
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Category</label>
                                <input
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Boys / Girls"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Year</label>
                                <input
                                    value={year}
                                    onChange={(event) => setYear(event.target.value)}
                                    className={inputClassName}
                                    placeholder="2"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Section</label>
                                <input
                                    value={section}
                                    onChange={(event) => setSection(event.target.value)}
                                    className={inputClassName}
                                    placeholder="A"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Department</label>
                                <input
                                    value={department}
                                    onChange={(event) => setDepartment(event.target.value)}
                                    className={inputClassName}
                                    placeholder="CSE"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Rank</label>
                                <input
                                    type="number"
                                    value={rank}
                                    onChange={(event) => setRank(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Score</label>
                                <input
                                    type="number"
                                    value={score}
                                    onChange={(event) => setScore(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClassName}>Attributes (JSON)</label>
                                <textarea
                                    value={attributes}
                                    onChange={(event) => setAttributes(event.target.value)}
                                    className={inputClassName}
                                    rows="3"
                                    placeholder='{"tag":"value"}'
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Active</div>
                                    <div className="text-xs text-gray-500">Toggle user access</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(event) => setIsActive(event.target.checked)}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserPage;
