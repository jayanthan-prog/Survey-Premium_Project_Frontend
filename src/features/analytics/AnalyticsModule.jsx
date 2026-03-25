import { useEffect, useMemo, useState } from "react";
import { ChartBarIcon, ClipboardDocumentCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { getDashboardSummary } from "../../services/dashboardService";
import { getSurveys, getSurveyParticipants } from "../../services/surveyApi";
import { getActionPlans } from "../../services/actionPlanApi";
import { useAuth } from "../../context/AuthContext";

const buildLastMonths = (count = 6) => {
    const labels = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push({
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            label: d.toLocaleDateString("en-US", { month: "short" }),
        });
    }
    return labels;
};

const monthKeyFromDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const toSmoothPath = (points) => {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let index = 0; index < points.length - 1; index += 1) {
        const current = points[index];
        const next = points[index + 1];
        const previous = points[index - 1] || current;
        const afterNext = points[index + 2] || next;

        const cp1x = current.x + (next.x - previous.x) / 6;
        const cp1y = current.y + (next.y - previous.y) / 6;
        const cp2x = next.x - (afterNext.x - current.x) / 6;
        const cp2y = next.y - (afterNext.y - current.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return path;
};

const MultiLineAreaChart = ({ title, categories, series }) => {
    const width = 700;
    const height = 300;
    const paddingX = 44;
    const paddingY = 30;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;

    const allValues = series.flatMap((item) => item.data);
    const maxValue = Math.max(1, ...allValues);
    const chartIdBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const buildPoints = (values) =>
        values.map((value, index) => ({
            x: paddingX + (index * plotWidth) / Math.max(1, values.length - 1),
            y: height - paddingY - (value / maxValue) * plotHeight,
            value,
        }));

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            </div>

            <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                    {series.map((item) => (
                        <div key={`${title}-${item.key}`} className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-[11px] text-gray-600">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.stroke }} />
                            {item.label}
                        </div>
                    ))}
                </div>

                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-xl bg-gradient-to-b from-slate-50 to-white">
                    <defs>
                        {series.map((item) => (
                            <linearGradient key={`gradient-${chartIdBase}-${item.key}`} id={`${chartIdBase}-${item.key}-fill`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={item.fill} stopOpacity="0.35" />
                                <stop offset="100%" stopColor={item.fill} stopOpacity="0.03" />
                            </linearGradient>
                        ))}
                    </defs>

                    {[0, 1, 2, 3, 4].map((line) => {
                        const y = paddingY + (line * plotHeight) / 4;
                        return <line key={`${title}-grid-${line}`} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
                    })}

                    {series.map((item) => {
                        const points = buildPoints(item.data);
                        const linePath = toSmoothPath(points);
                        const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

                        return (
                            <g key={`${title}-series-${item.key}`}>
                                <path d={areaPath} fill={`url(#${chartIdBase}-${item.key}-fill)`} />
                                <path d={linePath} fill="none" stroke={item.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                {points.map((point, index) => (
                                    <circle key={`${title}-${item.key}-${index}`} cx={point.x} cy={point.y} r="4.5" fill={item.stroke} stroke="white" strokeWidth="2" />
                                ))}
                            </g>
                        );
                    })}
                </svg>

                <div className="grid grid-cols-6 gap-2 mt-3 text-[11px] text-gray-500">
                    {categories.map((month) => (
                        <div key={`${title}-${month}`} className="text-center font-medium text-gray-600">{month}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AnalyticsModule = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [dashboard, setDashboard] = useState(null);
    const [surveys, setSurveys] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const [dashboardRes, surveysRes, participantsRes, plansRes] = await Promise.allSettled([
                    getDashboardSummary(token),
                    getSurveys(),
                    getSurveyParticipants(),
                    getActionPlans(),
                ]);

                if (!active) return;

                if (dashboardRes.status === "fulfilled") setDashboard(dashboardRes.value || null);
                if (surveysRes.status === "fulfilled") setSurveys(Array.isArray(surveysRes.value) ? surveysRes.value : []);
                if (participantsRes.status === "fulfilled") setParticipants(Array.isArray(participantsRes.value) ? participantsRes.value : []);
                if (plansRes.status === "fulfilled") setPlans(Array.isArray(plansRes.value) ? plansRes.value : []);

                const failures = [dashboardRes, surveysRes, participantsRes, plansRes].filter((item) => item.status === "rejected");
                if (failures.length) {
                    setError("Some analytics sources failed to load. Showing available data.");
                }
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load analytics.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => {
            active = false;
        };
    }, [token]);

    const monthMeta = useMemo(() => buildLastMonths(6), []);

    const surveyTrend = useMemo(() => {
        const seed = Object.fromEntries(monthMeta.map((m) => [m.key, { assigned: 0, completed: 0, dropped: 0 }]));

        for (const participant of participants) {
            const assignedKey = monthKeyFromDate(participant.invited_at || participant.created_at);
            if (assignedKey && seed[assignedKey]) {
                seed[assignedKey].assigned += 1;
            }

            const status = String(participant.status || "").toUpperCase();
            if (status === "COMPLETED") {
                const completedKey = monthKeyFromDate(participant.completed_at || participant.updated_at || participant.created_at);
                if (completedKey && seed[completedKey]) {
                    seed[completedKey].completed += 1;
                }
            }
            if (status === "DROPPED") {
                const droppedKey = monthKeyFromDate(participant.updated_at || participant.created_at);
                if (droppedKey && seed[droppedKey]) {
                    seed[droppedKey].dropped += 1;
                }
            }
        }

        return monthMeta.map((m) => ({ month: m.label, ...seed[m.key] }));
    }, [participants, monthMeta]);

    const actionPlanTrend = useMemo(() => {
        const seed = Object.fromEntries(monthMeta.map((m) => [m.key, { created: 0, active: 0, completed: 0 }]));

        for (const plan of plans) {
            const monthKey = monthKeyFromDate(plan.created_at);
            if (!monthKey || !seed[monthKey]) continue;

            seed[monthKey].created += 1;
            const status = String(plan.status || "").toUpperCase();
            if (["PENDING", "OPEN", "IN_PROGRESS"].includes(status)) seed[monthKey].active += 1;
            if (status === "COMPLETED") seed[monthKey].completed += 1;
        }

        return monthMeta.map((m) => ({ month: m.label, ...seed[m.key] }));
    }, [plans, monthMeta]);

    const surveyHighlights = useMemo(() => {
        const participantsBySurvey = new Map();

        for (const participant of participants) {
            const key = String(participant.survey_id || "");
            if (!key) continue;
            const existing = participantsBySurvey.get(key) || { total: 0, completed: 0 };
            existing.total += 1;
            if (String(participant.status || "").toUpperCase() === "COMPLETED") {
                existing.completed += 1;
            }
            participantsBySurvey.set(key, existing);
        }

        const rows = surveys.map((survey) => {
            const stat = participantsBySurvey.get(String(survey.survey_id)) || { total: 0, completed: 0 };
            const completionRate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
            return {
                survey: survey.title || `Survey ${survey.survey_id}`,
                totalParticipants: stat.total,
                completionRate,
            };
        });

        rows.sort((a, b) => b.totalParticipants - a.totalParticipants);
        return rows.slice(0, 6);
    }, [surveys, participants]);

    const totalParticipants = participants.length;
    const completedParticipants = participants.filter((p) => String(p.status || "").toUpperCase() === "COMPLETED").length;
    const completionRate = totalParticipants ? Math.round((completedParticipants / totalParticipants) * 100) : 0;

    const cards = [
        {
            label: "Total Users",
            value: Number(dashboard?.overview?.users || 0),
            icon: UserGroupIcon,
            tone: "text-blue-600",
            bg: "bg-blue-50",
            sub: "Registered on platform",
        },
        {
            label: "Total Surveys",
            value: Number(dashboard?.overview?.surveys || surveys.length),
            icon: ClipboardDocumentCheckIcon,
            tone: "text-purple-600",
            bg: "bg-purple-50",
            sub: `${Number(dashboard?.overview?.active_releases || 0)} active releases`,
        },
        {
            label: "Pending Approvals",
            value: Number(dashboard?.overview?.pending_approvals || 0),
            icon: ChartBarIcon,
            tone: "text-amber-600",
            bg: "bg-amber-50",
            sub: "Awaiting decision",
        },
        {
            label: "Participation Completion",
            value: `${completionRate}%`,
            icon: ChartBarIcon,
            tone: "text-emerald-600",
            bg: "bg-emerald-50",
            sub: `${completedParticipants}/${totalParticipants} participants completed`,
        },
    ];

    const surveySeries = [
        {
            key: "assigned",
            label: "Assigned",
            stroke: "#2563eb",
            fill: "#3b82f6",
            data: surveyTrend.map((item) => item.assigned),
        },
        {
            key: "completed",
            label: "Completed",
            stroke: "#10b981",
            fill: "#34d399",
            data: surveyTrend.map((item) => item.completed),
        },
        {
            key: "dropped",
            label: "Dropped",
            stroke: "#ef4444",
            fill: "#f87171",
            data: surveyTrend.map((item) => item.dropped),
        },
    ];

    const actionPlanSeries = [
        {
            key: "created",
            label: "Created",
            stroke: "#8b5cf6",
            fill: "#a78bfa",
            data: actionPlanTrend.map((item) => item.created),
        },
        {
            key: "active",
            label: "Active",
            stroke: "#06b6d4",
            fill: "#22d3ee",
            data: actionPlanTrend.map((item) => item.active),
        },
        {
            key: "completed",
            label: "Completed",
            stroke: "#22c55e",
            fill: "#4ade80",
            data: actionPlanTrend.map((item) => item.completed),
        },
    ];

    const months = monthMeta.map((item) => item.label);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                {loading && <span className="text-xs text-gray-500">Loading...</span>}
            </div>

            {error && <div className="text-sm text-amber-600">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`h-5 w-5 ${card.tone}`} />
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-500">{card.label}</div>
                        <div className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <MultiLineAreaChart
                    title="Survey Participation Trend"
                    categories={months}
                    series={surveySeries}
                />
                <MultiLineAreaChart
                    title="Action Plan Trend"
                    categories={months}
                    series={actionPlanSeries}
                />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Survey Highlights</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {surveyHighlights.map((item) => (
                        <div key={item.survey} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">{item.survey}</div>
                                <div className="text-xs text-gray-500">{item.totalParticipants} participants</div>
                            </div>
                            <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
                                {item.completionRate}% completion
                            </div>
                        </div>
                    ))}
                    {!surveyHighlights.length && (
                        <div className="px-5 py-4 text-sm text-gray-500">No analytics data available yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsModule;
