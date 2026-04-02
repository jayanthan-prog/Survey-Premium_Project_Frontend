import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "../../../context/AuthContext";
import { useConfirmation } from "../../../context/ConfirmationContext";
import {
    deleteSurveyResponse,
    exportSurveyResponses,
    getSurveyReport,
    getSurveyResponseById,
    getSurveyResponses,
} from "../../../services/surveyApi";

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed"];

const SurveyReportPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { confirm } = useConfirmation();

    const basePath = useMemo(() => (user?.role === "APPROVER" ? "/approver/surveys" : "/admin/surveys"), [user]);

    const [tab, setTab] = useState("analytics");
    const [report, setReport] = useState(null);
    const [responses, setResponses] = useState([]);
    const [responseDetail, setResponseDetail] = useState(null);
    const [selectedParticipationId, setSelectedParticipationId] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [error, setError] = useState("");
    const [actionBusy, setActionBusy] = useState(false);

    const loadReport = useCallback(async () => {
        if (!id) return;
        const data = await getSurveyReport(id);
        setReport(data);
    }, [id]);

    const loadResponses = useCallback(async () => {
        if (!id) return;
        setLoadingResponses(true);
        try {
            const payload = await getSurveyResponses(id, { search });
            const rows = Array.isArray(payload?.responses) ? payload.responses : [];
            setResponses(rows);

            if (rows.length && !rows.some((row) => row.participation_id === selectedParticipationId)) {
                setSelectedParticipationId(rows[0].participation_id);
            }
            if (!rows.length) {
                setSelectedParticipationId(null);
                setResponseDetail(null);
            }
        } finally {
            setLoadingResponses(false);
        }
    }, [id, search, selectedParticipationId]);

    const loadResponseDetail = useCallback(async () => {
        if (!id || !selectedParticipationId) return;
        const detail = await getSurveyResponseById(id, selectedParticipationId);
        setResponseDetail(detail);
    }, [id, selectedParticipationId]);

    useEffect(() => {
        let active = true;
        const run = async () => {
            setLoading(true);
            setError("");
            try {
                await Promise.all([loadReport(), loadResponses()]);
            } catch (err) {
                if (active) setError(err?.message || "Failed to load survey report.");
            } finally {
                if (active) setLoading(false);
            }
        };
        run();
        return () => {
            active = false;
        };
    }, [loadReport, loadResponses]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadResponses().catch((err) => setError(err?.message || "Failed to load responses."));
        }, 300);
        return () => clearTimeout(timer);
    }, [search, loadResponses]);

    useEffect(() => {
        loadResponseDetail().catch((err) => setError(err?.message || "Failed to load response detail."));
    }, [loadResponseDetail]);

    const handleDeleteResponse = async (participationId) => {
        const approved = await confirm({
            title: "Delete Response",
            message: "Delete this response? This action cannot be undone.",
            confirmText: "Delete",
            tone: "danger",
        });
        if (!approved) return;
        setActionBusy(true);
        try {
            await deleteSurveyResponse(id, participationId);
            await Promise.all([loadReport(), loadResponses()]);
        } catch (err) {
            setError(err?.message || "Failed to delete response.");
        } finally {
            setActionBusy(false);
        }
    };

    const handleExport = async (format) => {
        setActionBusy(true);
        try {
            await exportSurveyResponses(id, format, { search });
        } catch (err) {
            setError(err?.message || "Failed to export responses.");
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) return <div className="text-sm text-gray-500">Loading survey report...</div>;

    if (error && !report) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-800">Survey Report</h1>
                <p className="text-sm text-gray-500 mt-2">{error || "Report not found."}</p>
                <button type="button" onClick={() => navigate(basePath)} className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">Back to Surveys</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Survey Dashboard</h1>
                    <p className="text-sm text-gray-500">Analytics and response management for {report?.title}</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" disabled={actionBusy} onClick={() => handleExport("csv")} className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">Export CSV</button>
                    <button type="button" disabled={actionBusy} onClick={() => handleExport("xlsx")} className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">Export Excel</button>
                    <button type="button" onClick={() => navigate(basePath)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Back</button>
                </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex gap-2 border-b border-gray-200">
                <button type="button" onClick={() => setTab("analytics")} className={`px-4 py-2 text-sm font-medium ${tab === "analytics" ? "text-purple-700 border-b-2 border-purple-600" : "text-gray-500"}`}>Analytics</button>
                <button type="button" onClick={() => setTab("responses")} className={`px-4 py-2 text-sm font-medium ${tab === "responses" ? "text-purple-700 border-b-2 border-purple-600" : "text-gray-500"}`}>Responses</button>
            </div>

            {tab === "analytics" && (
                <div className="space-y-4">
                    {(report?.questions || []).map((question) => {
                        const type = String(question.type || "").toLowerCase();
                        const distribution = Array.isArray(question.distribution) ? question.distribution : [];
                        const textSubmissions = Array.isArray(question.submissions) ? question.submissions : [];

                        return (
                            <div key={question.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <div className="text-sm font-semibold text-gray-900">{question.text}</div>
                                <div className="mt-1 text-xs text-gray-500">{question.submissionCount || 0} submissions</div>

                                {(type === "single_choice" || type === "multiple_choice" || type === "dropdown" || type === "limited_dropdown" || type === "priority_select" || type === "multi_level_selection") && distribution.length > 0 && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                        <div className="h-60">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={distribution} dataKey="count" nameKey="label" outerRadius={85}>
                                                        {distribution.map((entry, idx) => <Cell key={`${entry.label}-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="h-60">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={distribution}>
                                                    <XAxis dataKey="label" interval={0} angle={-20} textAnchor="end" height={70} />
                                                    <YAxis allowDecimals={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#4f46e5" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {type === "rating" && (
                                    <div className="mt-4 space-y-3">
                                        <div className="text-sm text-gray-700">Average score: <span className="font-semibold">{question.average ?? "-"}</span></div>
                                        <div className="h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={distribution}>
                                                    <XAxis dataKey="label" />
                                                    <YAxis allowDecimals={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#059669" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {type === "matrix" && (
                                    <div className="mt-4 overflow-x-auto">
                                        <table className="min-w-full text-xs border border-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 border border-gray-200 text-left">Row</th>
                                                    <th className="px-3 py-2 border border-gray-200 text-left">Column Counts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(question.matrixAggregation || []).map((row) => (
                                                    <tr key={row.rowId}>
                                                        <td className="px-3 py-2 border border-gray-200">{row.rowLabel}</td>
                                                        <td className="px-3 py-2 border border-gray-200">{Object.entries(row.values || {}).map(([col, count]) => `${col}: ${count}`).join(", ") || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {(!distribution.length || type === "short_text" || type === "long_text" || type === "file_upload" || type === "date" || type === "number") && (
                                    <div className="mt-4 space-y-2">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Text Answers</div>
                                        {textSubmissions.length > 0 ? textSubmissions.map((submission) => (
                                            <div key={`${question.id}-${submission.answer_id}`} className="rounded-xl border border-gray-100 bg-slate-50 px-3 py-2 text-xs text-gray-700">
                                                <div className="font-medium text-gray-900">{submission.respondent_name} <span className="font-normal text-gray-500">({submission.respondent_email})</span></div>
                                                <div className="mt-1">{Array.isArray(submission.value) ? submission.value.join(", ") : String(submission.value ?? "-")}</div>
                                            </div>
                                        )) : <div className="text-xs text-gray-500">No submitted answers yet.</div>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {tab === "responses" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search responses..."
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-100"
                        />
                        <div className="mt-3 space-y-2 max-h-[520px] overflow-auto">
                            {loadingResponses && <div className="text-xs text-gray-500">Loading...</div>}
                            {!loadingResponses && responses.map((row) => (
                                <button
                                    key={row.participation_id}
                                    type="button"
                                    onClick={() => setSelectedParticipationId(row.participation_id)}
                                    className={`w-full text-left rounded-xl border px-3 py-2 ${selectedParticipationId === row.participation_id ? "border-purple-300 bg-purple-50" : "border-gray-100 bg-white hover:bg-gray-50"}`}
                                >
                                    <div className="text-xs font-semibold text-gray-800">{row.respondent_name}</div>
                                    <div className="text-xs text-gray-500">{row.respondent_email}</div>
                                    <div className="text-[11px] text-gray-400 mt-1">#{row.participation_id}</div>
                                </button>
                            ))}
                            {!loadingResponses && !responses.length && <div className="text-xs text-gray-500">No responses found.</div>}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        {responseDetail ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Response #{responseDetail.participation_id}</div>
                                        <div className="text-xs text-gray-500">{responseDetail.respondent_name} ({responseDetail.respondent_email})</div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={actionBusy}
                                        onClick={() => handleDeleteResponse(responseDetail.participation_id)}
                                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                    >
                                        Delete Response
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[540px] overflow-auto">
                                    {(responseDetail.answers || []).map((answer) => (
                                        <div key={answer.question_id} className="rounded-xl border border-gray-100 bg-slate-50 px-3 py-2">
                                            <div className="text-xs font-semibold text-gray-800">{answer.question_text}</div>
                                            <div className="mt-1 text-xs text-gray-700">{Array.isArray(answer.value) ? answer.value.join(", ") : typeof answer.value === "object" ? JSON.stringify(answer.value) : String(answer.value ?? "-")}</div>
                                        </div>
                                    ))}
                                    {responseDetail.group_answers && Object.keys(responseDetail.group_answers).length > 0 && (
                                        <div className="rounded-xl border border-gray-100 bg-slate-50 px-3 py-2">
                                            <div className="text-xs font-semibold text-gray-800">Group Answers</div>
                                            <pre className="mt-1 text-[11px] text-gray-700 whitespace-pre-wrap">{JSON.stringify(responseDetail.group_answers, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">Select a response to view details.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveyReportPage;
