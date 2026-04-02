import { useMemo, useState } from "react";

const buildInitials = (name) => {
    const text = String(name || "User").trim();
    const parts = text.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || "U").join("").slice(0, 2) || "U";
};

const HoverProfile = ({ user, children }) => {
    const [open, setOpen] = useState(false);

    const profile = useMemo(() => {
        const attributes = user?.attributes && typeof user.attributes === "object" ? user.attributes : {};
        return {
            name: String(user?.name || "User"),
            rollNo: user?.roll_no || user?.rollNo || attributes.rollNo || attributes.roll_no || user?.user_id || "-",
            score: user?.activity_score ?? user?.score ?? attributes.activity_score ?? attributes.score ?? 0,
            avatarUrl: user?.avatar_url || user?.avatarUrl || attributes.avatarUrl || attributes.profilePictureUrl || "",
            initials: buildInitials(user?.name || "User"),
        };
    }, [user]);

    return (
        <span className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {children}
            {open && (
                <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl">
                    <span className="flex items-center gap-3">
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white">
                            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" /> : profile.initials}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{profile.name}</span>
                            <span className="block text-xs text-slate-500">Roll no: {profile.rollNo}</span>
                        </span>
                    </span>
                    <span className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span>Activity score</span>
                        <span className="font-semibold text-slate-900">{profile.score ?? 0}</span>
                    </span>
                </span>
            )}
        </span>
    );
};

export default HoverProfile;
