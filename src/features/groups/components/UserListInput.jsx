import { useMemo, useState } from "react";
import ExcelImporter from "./ExcelImporter";

const UserListInput = ({
    label,
    items,
    setItems,
    options = [],
    placeholder = "Type name and press Enter..."
}) => {
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);
    const inputClassName = "flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    const normalizedOptions = useMemo(
        () => options.map((option) => {
            if (typeof option === "string") {
                return { value: option.trim(), label: option.trim() };
            }

            return {
                value: String(option?.value || option?.id || option?.email || option?.name || "").trim(),
                label: String(option?.label || option?.name || option?.email || option?.value || "").trim(),
            };
        }).filter((option) => option.value),
        [options]
    );

    const optionLookup = useMemo(
        () => new Map(normalizedOptions.map((option) => [option.value, option.label])),
        [normalizedOptions]
    );

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return normalizedOptions.filter((option) => {
            if (items.includes(option.value)) return false;
            if (!normalizedQuery) return true;
            return option.label.toLowerCase().includes(normalizedQuery) || option.value.toLowerCase().includes(normalizedQuery);
        }).slice(0, 8);
    }, [normalizedOptions, items, query]);

    const normalizeImportedItem = (item) => {
        if (typeof item === "string") {
            return item.trim();
        }

        if (item && typeof item === "object") {
            return String(item.email || item.Email || item.name || item.Name || item.user || "").trim();
        }

        return "";
    };

    const addItem = (value) => {
        const normalized = String(value || "").trim();
        if (!normalized || items.includes(normalized)) return;
        setItems((prev) => [...prev, normalized]);
        setQuery("");
    };

    const handleKeyDown = (e) => {
        if (e.key !== "Enter") {
            return;
        }

        e.preventDefault();

        const value = filteredOptions[0]?.value || query.trim();

        if (!value) {
            return;
        }

        addItem(value);
    };

    const handleImport = (data) => {
        const normalized = (Array.isArray(data) ? data : [])
            .map(normalizeImportedItem)
            .filter(Boolean);

        setItems((prev) => [...prev, ...normalized.filter((value) => !prev.includes(value))]);
    };

    const removeItem = (indexToRemove) => {
        setItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <label className={labelClassName}>
                {label}
            </label>

            <div className="relative mt-1 flex gap-2">
                <input
                    placeholder={placeholder}
                    className={inputClassName}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => window.setTimeout(() => setFocused(false), 120)}
                />

                {focused && filteredOptions.length > 0 && (
                    <div className="absolute left-0 right-[52px] top-full z-20 mt-2 max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                        {filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => addItem(option.value)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-purple-50"
                            >
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <ExcelImporter onImport={handleImport} />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {items.map((item, index) => (
                    <span
                        key={`${item}-${index}`}
                        className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                        {optionLookup.get(item) || item}
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
