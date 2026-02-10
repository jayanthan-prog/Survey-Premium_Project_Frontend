import ExcelImporter from "./ExcelImporter";

const UserListInput = ({
    label,
    items,
    setItems,
    placeholder = "Type name and press Enter..."
}) => {
    const inputClassName = "flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";
    const handleKeyDown = (e) => {
        if (e.key !== "Enter") {
            return;
        }

        e.preventDefault();

        const value = e.target.value.trim();

        if (!value) {
            return;
        }

        setItems((prev) => [...prev, value]);
        e.target.value = "";
    };

    const handleImport = (data) => {
        setItems((prev) => [...prev, ...data]);
    };

    const removeItem = (indexToRemove) => {
        setItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <label className={labelClassName}>
                {label}
            </label>

            <div className="flex gap-2 mt-1">
                <input
                    placeholder={placeholder}
                    className={inputClassName}
                    onKeyDown={handleKeyDown}
                />

                <ExcelImporter onImport={handleImport} />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {items.map((item, index) => (
                    <span
                        key={`${item}-${index}`}
                        className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                        {item}
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-purple-600"
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
