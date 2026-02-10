import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const SurveyReportPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();

    const basePath = useMemo(
        () => (user?.role === "APPROVER" ? "/approver/surveys" : "/admin/surveys"),
        [user]
    );

    const reports = useMemo(
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
                        responses: ["Same department", "Same year", "No preference"],
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
                        responses: ["Open after exams", "Need remote only"],
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
                        responses: ["More buses for evening", "Add Wi-Fi"],
                    },
                ],
            },
        ],
        []
    );

    const report = reports.find((item) => item.id === id);

    if (!report) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-800">Survey Report</h1>
                <p className="text-sm text-gray-500 mt-2">Report not found.</p>
                <button
                    type="button"
                    onClick={() => navigate(basePath)}
                    className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                    Back to Surveys
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Survey Report</h1>
                    <p className="text-sm text-gray-500">Detailed answers for {report.title}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(basePath)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                    Back to Surveys
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-xs text-gray-400">Survey</div>
                        <div className="text-xl font-semibold text-gray-900">{report.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {report.id} · Owner: {report.owner}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                            <div className="text-xs text-gray-400">Participants</div>
                            <div className="font-medium text-gray-700">{report.participants}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400">Completion</div>
                            <div className="font-medium text-gray-700">{report.completionRate}%</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400">Avg. time</div>
                            <div className="font-medium text-gray-700">{report.avgTime}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400">Completed on</div>
                            <div className="font-medium text-gray-700">{report.completedAt}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {report.answers.map((answer, index) => (
                    <div key={`${report.id}-answer-${index}`} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">{answer.question}</div>
                        <div className="mt-3 space-y-2">
                            {answer.responses.map((response, responseIndex) => {
                                if (typeof response === "string") {
                                    return (
                                        <div
                                            key={`${report.id}-response-${responseIndex}`}
                                            className="text-xs text-gray-600"
                                        >
                                            {response}
                                        </div>
                                    );
                                }
                                return (
                                    <div
                                        key={`${report.id}-response-${responseIndex}`}
                                        className="flex items-center justify-between text-xs text-gray-600"
                                    >
                                        <span>{response.label}</span>
                                        <span className="font-semibold text-gray-700">{response.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SurveyReportPage;
