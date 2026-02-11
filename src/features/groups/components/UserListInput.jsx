import { useState } from "react";
import { Search, X } from "lucide-react";

const UserListInput = ({
    label,
    items,
    setItems,
    availableUsers = [],
    placeholder = "Search and add users..."
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const inputClassName = "flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    // Filter available users based on search term
    const filteredUsers = availableUsers.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const name = (user.name || user.email || "").toLowerCase();
        return name.includes(searchLower);
    });

    // Check if a user is already added
    const isUserAdded = (user) => {
        return items.some(item => {
            const itemId = item.user_id || item.id;
            const userId = user.user_id || user.id;
            return itemId === userId;
        });
    };

    const handleAddUser = (user) => {
        if (!isUserAdded(user)) {
            setItems(prev => [...prev, user]);
        }
        setSearchTerm("");
        setShowDropdown(false);
    };

    const removeItem = (indexToRemove) => {
        setItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <label className={labelClassName}>
                {label}
            </label>

            <div className="relative mt-1">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            placeholder={placeholder}
                            className={`${inputClassName} pl-9`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    setShowDropdown(false);
                                }}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Dropdown */}
                {showDropdown && searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <button
                                    key={user.user_id || user.id}
                                    type="button"
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 ${
                                        isUserAdded(user) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    onClick={() => isUserAdded(user) ? null : handleAddUser(user)}
                                    disabled={isUserAdded(user)}
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-700">
                                            {user.name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                    {isUserAdded(user) && (
                                        <span className="text-xs text-purple-600">Added</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Selected items */}
            <div className="flex flex-wrap gap-2 mt-3">
                {items.length === 0 && (
                    <span className="text-sm text-gray-400 italic">No users added yet</span>
                )}
                {items.map((item, index) => (
                    <span
                        key={`${item.user_id || item.id}-${index}`}
                        className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                        {item.name || item.email}
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-purple-600 hover:text-purple-800 ml-1"
                        >
                            ✕
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default UserListInput;
