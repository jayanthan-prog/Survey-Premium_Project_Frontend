import { useState } from "react";

const UserMultiSelect = ({ label }) => {

    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);

    // 🔥 Fake API results
    const users = ["Arun", "Bala", "Charan", "Divya", "Kavin"]
        .filter(u => u.toLowerCase().includes(search.toLowerCase()));

    const addUser = (user) => {
        if (!selected.includes(user)) {
            setSelected([...selected, user]);
        }
    };

    const removeUser = (user) => {
        setSelected(selected.filter(u => u !== user));
    };

    return (
        <div>
            <label className="text-sm font-medium text-gray-600">
                {label}
            </label>

            {/* Selected chips */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selected.map(user => (
                    <span
                        key={user}
                        className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                        {user}
                        <button onClick={() => removeUser(user)}>✕</button>
                    </span>
                ))}
            </div>

            {/* Search */}
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2
                   focus:ring-2 focus:ring-purple-500 outline-none"
            />

            {/* Dropdown */}
            {search && (
                <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto bg-white shadow">
                    {users.map(user => (
                        <div
                            key={user}
                            onClick={() => addUser(user)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {user}
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default UserMultiSelect;
