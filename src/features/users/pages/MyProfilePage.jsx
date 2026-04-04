import { Mail, Phone, UserCircle2 } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";

function readAttribute(user, key) {
    if (!user) return "-";
    const value = user?.[key] ?? user?.attributes?.[key];
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
}

const MyProfilePage = () => {
    const { user } = useAuth();

    const avatarUrl = useMemo(
        () => user?.avatar_url || user?.avatarUrl || user?.attributes?.avatarUrl || user?.attributes?.profilePictureUrl || "",
        [user]
    );

    const initials = useMemo(() => {
        const name = String(user?.name || user?.email || "User");
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, [user]);

    const details = [
        { label: "Full Name", value: user?.name || "-" },
        { label: "Email", value: user?.email || "-" },
        { label: "Role", value: user?.role || "-" },
        { label: "Phone", value: readAttribute(user, "phone") },
        { label: "Department", value: readAttribute(user, "department") },
        { label: "Category", value: readAttribute(user, "category") },
        { label: "Year", value: readAttribute(user, "year") },
        { label: "Section", value: readAttribute(user, "section") },
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-slate-700">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={user?.name || "Profile"} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl font-semibold">{initials}</div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">{user?.name || "My Profile"}</h1>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2"><Mail size={14} /> {user?.email || "No email"}</span>
                            <span className="inline-flex items-center gap-2"><Phone size={14} /> {readAttribute(user, "phone")}</span>
                            <span className="inline-flex items-center gap-2"><UserCircle2 size={14} /> {user?.role || "No role"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
                <p className="mt-1 text-xs text-slate-500">This profile is read-only.</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {details.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                            <div className="mt-2 break-words text-sm font-medium text-slate-800">{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyProfilePage;
