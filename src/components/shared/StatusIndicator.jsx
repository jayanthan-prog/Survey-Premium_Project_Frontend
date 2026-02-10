export const StatusIndicator = ({ status = "unknown" }) => {
    const map = {
        active: "bg-green-500",
        pending: "bg-amber-500",
        error: "bg-red-500",
        unknown: "bg-gray-400",
    };

    return (
        <span className="inline-flex items-center gap-2 text-xs text-gray-600">
            <span className={`h-2 w-2 rounded-full ${map[status] || map.unknown}`} />
            {status}
        </span>
    );
};
