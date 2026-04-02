const UserCard = ({ user }) => {
    const attributes = user?.attributes && typeof user.attributes === "object" ? user.attributes : {};
    const name = String(user?.name || "User");
    const rollNo = user?.roll_no || user?.rollNo || attributes.rollNo || attributes.roll_no || user?.user_id || "-";
    const score = user?.activity_score ?? user?.score ?? attributes.activity_score ?? attributes.score ?? 0;
    const avatarUrl = user?.avatar_url || user?.avatarUrl || attributes.avatarUrl || attributes.profilePictureUrl || "";
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "U")
        .join("") || "U";

    return (
        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-semibold text-white">
                {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-900">{name}</span>
                <span className="block text-[11px] text-slate-500">Roll no: {rollNo} • Score: {score ?? 0}</span>
            </span>
        </span>
    );
};

export default UserCard;
