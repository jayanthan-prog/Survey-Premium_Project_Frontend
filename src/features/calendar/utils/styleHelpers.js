// Style/badge utilities for event types
export const getTypeBadge = (type) => {
    if (type === "Survey") return "bg-purple-50 text-purple-700 border border-purple-200";
    if (type === "Assessment") return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
};

export const getTypeColor = (type) => {
    if (type === "Survey") return "bg-orange-500";
    if (type === "Assessment") return "bg-blue-500";
    return "bg-emerald-500";
};
