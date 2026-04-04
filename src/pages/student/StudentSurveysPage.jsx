import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, Search, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getSurveyParticipants, getSurveys } from "../../services/surveyApi";

const DEFAULT_SURVEY_IMAGE = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80";

function parseDateValue(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSurveyClosed(survey) {
    const status = String(survey?.status || "").toUpperCase();
    if (status !== "PUBLISHED") return true;

    const frozen = Boolean(survey?.latest_release_is_frozen);
    if (frozen) return true;

    const closesAt = parseDateValue(survey?.latest_release_closes_at || survey?.deadline || survey?.closes_at || survey?.due_at || survey?.end_date);
    if (closesAt && closesAt.getTime() <= Date.now()) return true;

    return false;
}

function formatDeadline(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "May 30, 2024";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function StudentSurveysPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [completedSurveyIds, setCompletedSurveyIds] = useState(new Set());

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const [surveysResponse, participantsResponse] = await Promise.all([
                    getSurveys(),
                    getSurveyParticipants(),
                ]);
                if (!active) return;

                const surveyList = Array.isArray(surveysResponse) ? surveysResponse : [];
                const participants = Array.isArray(participantsResponse) ? participantsResponse : [];
                const myCompleted = participants
                    .filter((row) => Number(row?.user_id) === Number(user?.user_id) && String(row?.status || "").toUpperCase() === "COMPLETED")
                    .map((row) => Number(row?.survey_id))
                    .filter((id) => Number.isFinite(id));

                setSurveys(surveyList);
                setCompletedSurveyIds(new Set(myCompleted));
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
    }, [user?.user_id]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return surveys.filter((survey) => {
            const title = String(survey.title || "").toLowerCase();
            const code = String(survey.code || survey.survey_id || "").toLowerCase();
            return !query || title.includes(query) || code.includes(query);
        });
    }, [surveys, search]);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">My Surveys</h1>
                <label className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search surveys"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-violet-100 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    />
                </label>
            </div>

            {loading && <div className="text-sm text-gray-500">Loading surveys...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filtered.map((survey) => {
                    const isCompleted = completedSurveyIds.has(Number(survey.survey_id));
                    const closed = isSurveyClosed(survey);
                    const createdBy = survey?.created_by_name || survey?.created_by || "Sarah Johnson";
                    const deadline = formatDeadline(survey?.deadline || survey?.closes_at || survey?.due_at || survey?.end_date);

                    return (
                        <article
                            key={survey.survey_id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="h-28 rounded-xl overflow-hidden bg-slate-100">
                                <img
                                    src={survey?.thumbnail_url || DEFAULT_SURVEY_IMAGE}
                                    alt={survey?.title || "Survey"}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>

                            <div className="p-2 pt-3 flex h-full flex-col">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-base font-bold leading-snug text-slate-700 line-clamp-2">
                                        {survey.title || "Customer Satisfaction Survey"}
                                    </h3>
                                    {!isCompleted && closed && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                                            Survey Closed
                                        </span>
                                    )}
                                    {isCompleted && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                                            <CheckCircle2 size={12} /> Completed
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <User size={14} className="text-slate-500 shrink-0" />
                                        <span className="truncate">{createdBy}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <CalendarDays size={14} className="text-slate-500" />
                                        <span>{deadline}</span>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <button
                                        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isCompleted
                                            ? "bg-emerald-50 text-emerald-700 cursor-not-allowed"
                                            : closed
                                                ? "bg-slate-200 text-slate-700 cursor-not-allowed"
                                                : "bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white shadow-sm"
                                            }`}
                                        onClick={() => {
                                            if (isCompleted || closed) return;
                                            navigate(`/student/surveys/${survey.survey_id}`);
                                        }}
                                        disabled={isCompleted || closed}
                                    >
                                        {isCompleted ? "You have completed this survey" : closed ? "Survey Closed" : "Take Survey"}
                                        {!isCompleted && !closed && <ArrowRight size={15} />}
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
                {!loading && filtered.length === 0 && (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                        <p className="text-sm font-medium text-slate-700">No surveys found</p>
                        <p className="mt-1 text-xs text-slate-500">Try a different search term or switch the status filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
