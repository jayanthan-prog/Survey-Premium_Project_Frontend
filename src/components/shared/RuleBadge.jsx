export const RuleBadge = ({ label, tone = "neutral" }) => {
    const tones = {
        neutral: "bg-gray-100 text-gray-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-amber-100 text-amber-700",
        danger: "bg-red-100 text-red-700",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone] || tones.neutral}`}>
            {label}
        </span>
    );
};
