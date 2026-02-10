import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SurveysModule = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const stats = [
        { label: "Approved", value: 12, tone: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Draft", value: 4, tone: "text-amber-600", bg: "bg-amber-50" },
        { label: "Archived", value: 7, tone: "text-slate-600", bg: "bg-slate-50" },
    ];

    const completedSurveys = useMemo(
        () => [
            {
                id: "SVY-1024",
                title: "Hostel Preference 2026",
                owner: "Admin",
                participants: 812,
                completedAt: "2026-01-28",
                avgTime: "04:12",
                completionRate: 96,
                answers: [
                    {
                        question: "Preferred hostel block",
                        type: "single_choice",
                        responses: [
                            { label: "Block A", count: 320 },
                            { label: "Block B", count: 270 },
                            { label: "Block C", count: 222 },
                        ],
                    },
                    {
                        question: "Roommate preference",
                        type: "text",
                        responses: [
                            "Same department",
                            "Same year",
                            "No preference",
                        ],
                    },
                ],
            },
            {
                id: "SVY-1020",
                title: "Internship Willingness",
                owner: "Approver",
                participants: 560,
                completedAt: "2026-01-20",
                avgTime: "03:05",
                completionRate: 88,
                answers: [
                    {
                        question: "Preferred internship duration",
                        type: "single_choice",
                        responses: [
                            { label: "2 months", count: 210 },
                            { label: "3 months", count: 280 },
                            { label: "6 months", count: 70 },
                        ],
                    },
                    {
                        question: "Availability notes",
                        type: "text",
                        responses: [
                            "Open after exams",
                            "Need remote only",
                        ],
                    },
                ],
            },
            {
                id: "SVY-1017",
                title: "Elective Course Bidding",
                owner: "Admin",
                participants: 904,
                completedAt: "2026-01-10",
                avgTime: "06:21",
                completionRate: 91,
                answers: [
                    {
                        question: "Top elective choice",
                        type: "single_choice",
                        responses: [
                            { label: "Machine Learning", count: 420 },
                            { label: "Cloud Systems", count: 310 },
                            { label: "Cybersecurity", count: 174 },
                        ],
                    },
                ],
            },
            {
                id: "SVY-1009",
                title: "Transport Facilities Feedback",
                owner: "Approver",
                participants: 430,
                completedAt: "2025-12-20",
                avgTime: "02:45",
                completionRate: 84,
                answers: [
                    {
                        question: "Preferred pickup time",
                        type: "single_choice",
                        responses: [
                            { label: "07:00 - 08:00", count: 190 },
                            { label: "08:00 - 09:00", count: 150 },
                            { label: "09:00 - 10:00", count: 90 },
                        ],
                    },
                    {
                        question: "Additional comments",
                        type: "text",
                        responses: [
                            "More buses for evening",
                            "Add Wi-Fi",
                        ],
                    },
                ],
            },
        ],
        []
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSurveyId, setSelectedSurveyId] = useState(completedSurveys[0]?.id);

    const filteredSurveys = useMemo(
        () =>
            completedSurveys.filter((survey) => {
                const query = searchTerm.trim().toLowerCase();
                if (!query) return true;
                return (
                    survey.title.toLowerCase().includes(query) ||
                    survey.id.toLowerCase().includes(query) ||
                    survey.owner.toLowerCase().includes(query)
                );
            }),
        [completedSurveys, searchTerm]
    );

    useEffect(() => {
        if (!filteredSurveys.length) return;
        const exists = filteredSurveys.some((item) => item.id === selectedSurveyId);
        if (!exists) {
            setSelectedSurveyId(filteredSurveys[0].id);
        }
    }, [filteredSurveys, selectedSurveyId]);

    const selectedSurvey = filteredSurveys.find((item) => item.id === selectedSurveyId) || filteredSurveys[0];

    const canCreate = user && ["ADMIN", "APPROVER"].includes(user.role);
    const basePath = user?.role === "APPROVER" ? "/approver/surveys" : "/admin/surveys";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Surveys</h1>
                </div>
                {canCreate && (
                    <button
                        onClick={() => navigate(`${basePath}/create`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
                    >
                        + Create Survey
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                    >
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${stat.bg} ${stat.tone}`}>
                            {stat.label}
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-gray-900">{stat.value}</div>
                        <p className="text-xs text-gray-400 mt-1">Updated today</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800">Completed Surveys</h2>
                        </div>
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search surveys..."
                            className="w-56 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredSurveys.map((survey) => (
                            <button
                                type="button"
                                key={survey.id}
                                onClick={() => {
                                    setSelectedSurveyId(survey.id);
                                }}
                                className={`w-full text-left px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-slate-50 transition ${selectedSurveyId === survey.id ? "bg-slate-50" : "bg-white"
                                    }`}
                            >
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{survey.title}</div>
                                    <div className="text-xs text-gray-500">{survey.id} · Owner: {survey.owner}</div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div>{survey.participants} participants</div>
                                    <div>{survey.completedAt}</div>
                                </div>
                            </button>
                        ))}
                        {!filteredSurveys.length && (
                            <div className="px-6 py-8 text-sm text-gray-500">No surveys match your search.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-800">Survey Details</h3>
                    {selectedSurvey ? (
                        <div className="mt-4 space-y-3 text-sm text-gray-600">
                            <div>
                                <div className="text-xs text-gray-400">Survey</div>
                                <div className="font-medium text-gray-900">{selectedSurvey.title}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-400">Survey ID</div>
                                    <div className="font-medium text-gray-700">{selectedSurvey.id}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Owner</div>
                                    <div className="font-medium text-gray-700">{selectedSurvey.owner}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Completion rate</div>
                                    <div className="font-medium text-gray-700">{selectedSurvey.completionRate}%</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Avg. time</div>
                                    <div className="font-medium text-gray-700">{selectedSurvey.avgTime}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Completed on</div>
                                <div className="font-medium text-gray-700">{selectedSurvey.completedAt}</div>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={() => navigate(`${basePath}/report/${selectedSurvey.id}`)}
                                    className="w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                                >
                                    View Full Report
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">Select a survey to see details.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SurveysModule;
