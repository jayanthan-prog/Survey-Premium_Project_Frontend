import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

const API_BASE = "http://localhost:4000/api";

const AddUserPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [category, setCategory] = useState("");
    const [year, setYear] = useState("");
    const [section, setSection] = useState("");
    const [department, setDepartment] = useState("");
    const [role, setRole] = useState("USER");

    const inputClassName =
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            // Create user (role is automatically added to user_roles table)
            const response = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    phone: phone || null,
                    category: category || null,
                    year: year || null,
                    section: section || null,
                    department: department || null,
                    role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Failed to create user");
                setLoading(false);
                return;
            }

            toast.success(data.message || "User created successfully");
            navigate("/admin/users");
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error("An error occurred while creating user");
        } finally {
            setLoading(false);
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
                        onClick={() => navigate("/admin/users")}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <form className="h-full overflow-y-auto space-y-6 pr-2">
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
                                <label className={labelClassName}>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className={inputClassName}
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Role</label>
                                <select
                                    value={role}
                                    onChange={(event) => setRole(event.target.value)}
                                    className={inputClassName}
                                    required
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="APPROVER">Approver</option>
                                </select>
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
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserPage;
