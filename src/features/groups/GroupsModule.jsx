import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const GroupsModule = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // 🔥 Fake Data (later replace with API)
    const [groups] = useState([
        {
            id: 1,
            name: "Placement Training",
            members: 120,
            createdBy: "Admin",
            status: "Active",
        },
        {
            id: 2,
            name: "SSG",
            members: 45,
            createdBy: "Approver",
            status: "Active",
        },
        {
            id: 3,
            name: "Special Labs",
            members: 32,
            createdBy: "Admin",
            status: "Inactive",
        },
        {
            id: 4,
            name: "Academics",
            members: 300,
            createdBy: "Admin",
            status: "Active",
        },
    ]);

    const [search, setSearch] = useState("");

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow p-6">

            {/* 🔥 Header */}
            <div className="flex justify-between items-center mb-6">

                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        User Groups
                    </h2>
                </div>

                {/* CREATE BUTTON */}
                <button
                    onClick={() =>
                        navigate(user?.role === "APPROVER" ? "/approver/groups/create" : "/admin/groups/create")
                    }
                    className="bg-purple-600 hover:bg-purple-700 
              text-white px-4 py-2 rounded-lg 
              text-sm font-medium transition"
                >
                    + Create Group
                </button>

            </div>

            {/* 🔥 Search */}
            <div className="mb-4">
                <input
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-72 border border-gray-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* 🔥 Table */}
            <div className="overflow-x-auto">

                <table className="w-full border-collapse">

                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-3 text-sm font-semibold text-gray-600">
                                Group Name
                            </th>
                            <th className="py-3 text-sm font-semibold text-gray-600">
                                Members
                            </th>
                            <th className="py-3 text-sm font-semibold text-gray-600">
                                Created By
                            </th>
                            <th className="py-3 text-sm font-semibold text-gray-600">
                                Status
                            </th>
                            <th className="py-3 text-sm font-semibold text-gray-600">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        {filteredGroups.map((group) => (
                            <tr
                                key={group.id}
                                className="border-b hover:bg-gray-50 transition"
                            >
                                <td className="py-4 font-medium text-gray-700">
                                    {group.name}
                                </td>

                                <td className="py-4 text-gray-600">
                                    {group.members}
                                </td>

                                <td className="py-4 text-gray-600">
                                    {group.createdBy}
                                </td>

                                <td className="py-4">
                                    <span
                                        className={`px-3 py-1 text-xs rounded-full font-medium
                      ${group.status === "Active"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-600"
                                            }
                    `}
                                    >
                                        {group.status}
                                    </span>
                                </td>

                                <td className="py-4 flex gap-3 text-sm">
                                    <button className="text-purple-600 hover:underline">
                                        View
                                    </button>

                                    <button className="text-gray-600 hover:underline">
                                        Edit
                                    </button>
                                </td>

                            </tr>
                        ))}

                    </tbody>
                </table>

            </div>

        </div>
    );
};

export default GroupsModule;
