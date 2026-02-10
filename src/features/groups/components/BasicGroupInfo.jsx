const BasicGroupInfo = ({
    groupName,
    setGroupName,
    desc,
    setDesc,
    category,
    setCategory,
    categories,
    newCategory,
    setNewCategory,
    addCategory
}) => {
    const inputClassName = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">
                Basic Information
            </h2>

            {/* GROUP NAME */}
            <div>
                <label className={labelClassName}>
                    Group Name
                </label>

                <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className={inputClassName}
                    placeholder="Placement Training"
                    required
                />
            </div>

            {/* DESCRIPTION */}
            <div>
                <label className={labelClassName}>
                    Description
                </label>

                <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className={inputClassName}
                    rows="3"
                />
            </div>

            {/* CATEGORY */}
            <div>
                <label className={labelClassName}>
                    Category
                </label>

                <div className="flex gap-2 mt-1">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        required
                    >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                            <option key={cat}>{cat}</option>
                        ))}
                    </select>

                    <input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Add"
                        className="w-1/2 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-800 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    />

                    <button
                        type="button"
                        onClick={addCategory}
                        className="bg-purple-600 text-white px-3 rounded-xl shadow-sm hover:bg-purple-700"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BasicGroupInfo;
