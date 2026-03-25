// Style/badge utilities for event types
export const getTypeBadge = (type) => {
    if (type === "Survey") return "bg-purple-50 text-purple-700 border border-purple-200";
    if (type === "Allocation") return "bg-blue-50 text-blue-700 border border-blue-200";
    if (type === "Approval") return "bg-amber-50 text-amber-700 border border-amber-200";
    if (type === "Reminder") return "bg-rose-50 text-rose-700 border border-rose-200";
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
};

export const getTypeColor = (type) => {
    if (type === "Survey") return "bg-purple-500";
    if (type === "Allocation") return "bg-blue-500";
    if (type === "Approval") return "bg-amber-500";
    if (type === "Reminder") return "bg-rose-500";
    return "bg-emerald-500";
};
