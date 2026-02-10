export const SurveyCard = ({ title, subtitle, status }) => {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <span className="text-xs font-medium text-gray-500">{status}</span>
            </div>
            {subtitle && <p className="mt-2 text-xs text-gray-500">{subtitle}</p>}
        </div>
    );
};
