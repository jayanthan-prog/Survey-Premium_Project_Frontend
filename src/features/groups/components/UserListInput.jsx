import { useMemo, useState } from "react";
import ExcelImporter from "./ExcelImporter";
import HoverProfile from "../../../components/profile/HoverProfile";

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

    const normalizedOptions = useMemo(() => {
        return options
            .map((option) => {
                if (typeof option === "string") {
                    const value = option.trim();
                    return { value, label: value, user: null };
                }

                const user = option?.user && typeof option.user === "object" ? option.user : null;
                const value = String(option?.value || option?.id || user?.email || user?.name || option?.email || option?.name || "").trim();
                const label = String(option?.label || user?.name || option?.name || user?.email || option?.email || option?.value || value || "").trim();

                const email = String(user?.email || option?.email || "").trim();
                const name = String(user?.name || option?.name || "").trim();

                return {
                    value,
                    label,
                    user,
                    name,
                    email,
                };
            })
            .filter((option) => option.value);
    }, [options]);

    const optionLookup = useMemo(() => new Map(normalizedOptions.map((option) => [option.value, option])), [normalizedOptions]);

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return normalizedOptions.filter((option) => {
            if (items.includes(option.value)) return false;
            if (!normalizedQuery) return true;
            const haystack = [option.label, option.value, option.name, option.email]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        }).slice(0, 8);
    }, [normalizedOptions, items, query]);

    const buildInitials = (text) => {
        const value = String(text || "User").trim();
        const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);
        return parts.map((part) => part[0]?.toUpperCase() || "U").join("").slice(0, 2) || "U";
    };

    const renderOptionRow = (option) => {
        const user = option.user;
        const name = String(option.name || user?.name || option.label || "User").trim() || "User";
        const email = String(option.email || user?.email || (option.value || "")).trim();
        const attributes = user?.attributes && typeof user.attributes === "object" ? user.attributes : {};
        const avatarUrl = user?.avatar_url || user?.avatarUrl || attributes.avatarUrl || attributes.profilePictureUrl || "";
        const initials = buildInitials(name || email);

        const content = (
            <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials}
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{name}</span>
                    <span className="block truncate text-xs text-slate-500">{email}</span>
                </span>
            </span>
        );

        if (!user) return content;
        return <HoverProfile user={user}>{content}</HoverProfile>;
    };

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
                                {renderOptionRow(option)}
                            </button>
                        ))}
                    </div>
                )}

                <ExcelImporter onImport={handleImport} />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
                {items.map((item, index) => (
                    (() => {
                        const option = optionLookup.get(item);
                        const user = option?.user;
                        const name = String(option?.name || option?.label || item).trim();
                        const email = String(option?.email || (option?.value || item)).trim();
                        const chipBody = (
                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                <span className="max-w-[240px] truncate">{name || email}</span>
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-purple-600"
                                >
                                    ✕
                                </button>
                            </span>
                        );

                        if (!user) {
                            return (
                                <span key={`${item}-${index}`}>{chipBody}</span>
                            );
                        }

                        return (
                            <HoverProfile key={`${item}-${index}`} user={user}>
                                {chipBody}
                            </HoverProfile>
                        );
                    })()
                ))}
            </div>
        </div>
    );
};

export default UserListInput;
