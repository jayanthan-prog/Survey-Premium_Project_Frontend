import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSurveys } from "../../services/surveyApi";

export default function StudentSurveysPage() {
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const response = await getSurveys();
                if (!active) return;
                setSurveys(Array.isArray(response) ? response : []);
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load surveys.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    const filtered = useMemo(
        () => surveys.filter((survey) => String(survey.title || "").toLowerCase().includes(search.toLowerCase())),
        [surveys, search]
    );

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">My Surveys</h1>
                <input
                    type="text"
                    placeholder="Search surveys..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
            </div>

            {loading && <div className="text-sm text-gray-500">Loading surveys...</div>}
            {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filtered.map((survey) => (
                    <div key={survey.survey_id} className="flex flex-col bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                            <div className="text-lg font-semibold text-gray-900 mb-1">{survey.title}</div>
                            <div className="text-xs text-gray-500 mb-2">Code: {survey.code || `ID-${survey.survey_id}`}</div>
                            <span className="px-2 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-100 text-blue-700">Available</span>
                        </div>
                        <div className="mt-4">
                            <button
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-medium w-full"
                                onClick={() => navigate(`/student/surveys/${survey.survey_id}`)}
                            >
                                Take Survey
                            </button>
                        </div>
                    </div>
                ))}
                {!loading && filtered.length === 0 && (
                    <div className="text-sm text-gray-500">No surveys available.</div>
                )}
            </div>
        </div>
    );
}
