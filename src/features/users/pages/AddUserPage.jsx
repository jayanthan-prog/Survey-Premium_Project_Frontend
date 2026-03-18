import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { createUser } from "../../../services/userService";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const ROLE_OPTIONS = ["USER", "APPROVER", "ADMIN"];

const AddUserPage = () => {
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

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
    const [role, setRole] = useState("USER");

    const inputClassName =
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";
    const roleBasePath = user?.role === "APPROVER" ? "/approver" : "/admin";

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const payload = {
            name,
            email,
            phone: phone || null,
            is_active: isActive,
            category: category || null,
            year: year || null,
            section: section || null,
            department: department || null,
            rank: rank ? Number(rank) : null,
            score: score ? Number(score) : null,
            role,
            attributes: {},
        };

        try {
            setSaving(true);
            await createUser(token, payload);
            navigate(`${roleBasePath}/users`);
        } catch (err) {
            setError(err?.message || "Failed to create user.");
        } finally {
            setSaving(false);
        }
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
                        onClick={() => navigate(`${roleBasePath}/users`)}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-user-form"
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        {saving ? "Saving..." : "Save User"}
                    </button>
                </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

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
                                <label className={labelClassName}>Gender</label>
                                <select
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    className={inputClassName}
                                >
                                    <option value="">Select gender</option>
                                    {GENDER_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
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
                            <div>
                                <label className={labelClassName}>Role</label>
                                <select
                                    value={role}
                                    onChange={(event) => setRole(event.target.value)}
                                    className={inputClassName}
                                >
                                    {ROLE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Active</div>
                                    <div className="text-xs text-gray-500">Allow this user to sign in and access the system.</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsActive((prev) => !prev)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isActive ? "bg-purple-600" : "bg-gray-200"}`}
                                    aria-pressed={isActive}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserPage;
