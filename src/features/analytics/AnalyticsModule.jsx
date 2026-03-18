import { ChartBarIcon, ClipboardDocumentCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const monthlySurveyStats = [
    {
        month: "Jan",
        students: { assigned: 520, completed: 446, halfway: 48, dropped: 26 },
        teachers: { assigned: 68, completed: 58, halfway: 6, dropped: 4 },
    },
    {
        month: "Feb",
        students: { assigned: 560, completed: 472, halfway: 56, dropped: 32 },
        teachers: { assigned: 74, completed: 62, halfway: 8, dropped: 4 },
    },
    {
        month: "Mar",
        students: { assigned: 590, completed: 505, halfway: 50, dropped: 35 },
        teachers: { assigned: 80, completed: 69, halfway: 7, dropped: 4 },
    },
    {
        month: "Apr",
        students: { assigned: 610, completed: 534, halfway: 44, dropped: 32 },
        teachers: { assigned: 84, completed: 73, halfway: 7, dropped: 4 },
    },
    {
        month: "May",
        students: { assigned: 635, completed: 548, halfway: 52, dropped: 35 },
        teachers: { assigned: 90, completed: 77, halfway: 8, dropped: 5 },
    },
    {
        month: "Jun",
        students: { assigned: 660, completed: 572, halfway: 50, dropped: 38 },
        teachers: { assigned: 96, completed: 82, halfway: 9, dropped: 5 },
    },
];

const actionPlanMonthlyStats = [
    { month: "Jan", created: 16, active: 9, completed: 7, overdue: 2 },
    { month: "Feb", created: 18, active: 11, completed: 9, overdue: 3 },
    { month: "Mar", created: 20, active: 12, completed: 10, overdue: 3 },
    { month: "Apr", created: 23, active: 13, completed: 12, overdue: 2 },
    { month: "May", created: 22, active: 12, completed: 14, overdue: 2 },
    { month: "Jun", created: 24, active: 14, completed: 15, overdue: 1 },
];

const surveyHighlights = [
    { survey: "Hostel Preference 2026", totalParticipants: 812, completionRate: 96 },
    { survey: "Internship Willingness", totalParticipants: 560, completionRate: 88 },
    { survey: "Elective Course Bidding", totalParticipants: 904, completionRate: 91 },
    { survey: "Transport Facilities Feedback", totalParticipants: 430, completionRate: 84 },
];

const monthlyTotals = (roleKey) =>
    monthlySurveyStats.reduce(
        (acc, row) => {
            const point = row[roleKey];
            return {
                assigned: acc.assigned + point.assigned,
                completed: acc.completed + point.completed,
                halfway: acc.halfway + point.halfway,
                dropped: acc.dropped + point.dropped,
            };
        },
        { assigned: 0, completed: 0, halfway: 0, dropped: 0 }
    );

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

const MultiLineAreaChart = ({ title, subtitle, categories, series }) => {
    const width = 700;
    const height = 300;
    const paddingX = 44;
    const paddingY = 30;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;

    const allValues = series.flatMap((item) => item.data);
    const maxValue = Math.max(...allValues);
    const chartIdBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const buildPoints = (values) =>
        values.map((value, index) => ({
            x: paddingX + (index * plotWidth) / (values.length - 1),
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
    const studentTotals = monthlyTotals("students");
    const teacherTotals = monthlyTotals("teachers");

    const avgSurveyCompletion = Math.round(
        surveyHighlights.reduce((acc, item) => acc + item.completionRate, 0) / surveyHighlights.length
    );

    const months = monthlySurveyStats.map((item) => item.month);

    const studentSeries = [
        {
            key: "assigned",
            label: "Assigned",
            stroke: "#2563eb",
            fill: "#3b82f6",
            data: monthlySurveyStats.map((item) => item.students.assigned),
        },
        {
            key: "completed",
            label: "Completed",
            stroke: "#10b981",
            fill: "#34d399",
            data: monthlySurveyStats.map((item) => item.students.completed),
        },
        {
            key: "halfway",
            label: "Halfway",
            stroke: "#f59e0b",
            fill: "#fbbf24",
            data: monthlySurveyStats.map((item) => item.students.halfway),
        },
        {
            key: "dropped",
            label: "Dropped",
            stroke: "#ef4444",
            fill: "#f87171",
            data: monthlySurveyStats.map((item) => item.students.dropped),
        },
    ];

    const teacherSeries = [
        {
            key: "assigned",
            label: "Assigned",
            stroke: "#2563eb",
            fill: "#3b82f6",
            data: monthlySurveyStats.map((item) => item.teachers.assigned),
        },
        {
            key: "completed",
            label: "Completed",
            stroke: "#10b981",
            fill: "#34d399",
            data: monthlySurveyStats.map((item) => item.teachers.completed),
        },
        {
            key: "halfway",
            label: "Halfway",
            stroke: "#f59e0b",
            fill: "#fbbf24",
            data: monthlySurveyStats.map((item) => item.teachers.halfway),
        },
        {
            key: "dropped",
            label: "Dropped",
            stroke: "#ef4444",
            fill: "#f87171",
            data: monthlySurveyStats.map((item) => item.teachers.dropped),
        },
    ];

    const actionPlanSeries = [
        {
            key: "created",
            label: "Created",
            stroke: "#8b5cf6",
            fill: "#a78bfa",
            data: actionPlanMonthlyStats.map((item) => item.created),
        },
        {
            key: "active",
            label: "Active",
            stroke: "#06b6d4",
            fill: "#22d3ee",
            data: actionPlanMonthlyStats.map((item) => item.active),
        },
        {
            key: "completed",
            label: "Completed",
            stroke: "#22c55e",
            fill: "#4ade80",
            data: actionPlanMonthlyStats.map((item) => item.completed),
        },
        {
            key: "overdue",
            label: "Overdue",
            stroke: "#f43f5e",
            fill: "#fb7185",
            data: actionPlanMonthlyStats.map((item) => item.overdue),
        },
    ];

    const cards = [
        {
            label: "Student Assigned",
            value: studentTotals.assigned,
            icon: UserGroupIcon,
            tone: "text-blue-600",
            bg: "bg-blue-50",
            sub: `${studentTotals.completed} completed`,
        },
        {
            label: "Teacher Assigned",
            value: teacherTotals.assigned,
            icon: ClipboardDocumentCheckIcon,
            tone: "text-purple-600",
            bg: "bg-purple-50",
            sub: `${teacherTotals.completed} completed`,
        },
        {
            label: "Student Drop-offs",
            value: studentTotals.dropped,
            icon: ChartBarIcon,
            tone: "text-rose-600",
            bg: "bg-rose-50",
            sub: `${studentTotals.halfway} stopped halfway`,
        },
        {
            label: "Avg Survey Completion",
            value: `${avgSurveyCompletion}%`,
            icon: ChartBarIcon,
            tone: "text-emerald-600",
            bg: "bg-emerald-50",
            sub: "Across recent completed surveys",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
            </div>

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
                    title="Student Monthly Survey Stats"
                    categories={months}
                    series={studentSeries}
                />
                <MultiLineAreaChart
                    title="Teacher Monthly Survey Stats"
                    categories={months}
                    series={teacherSeries}
                />
            </div>

            <MultiLineAreaChart
                title="Action Plan Monthly Trend"
                categories={actionPlanMonthlyStats.map((item) => item.month)}
                series={actionPlanSeries}
            />

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
                </div>
            </div>
        </div>
    );
};

export default AnalyticsModule;
