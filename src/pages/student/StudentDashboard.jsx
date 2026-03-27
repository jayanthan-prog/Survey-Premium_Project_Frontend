
import {
    ClipboardList,
    CheckSquare,
    BarChart3,
    Calendar,
    Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary } from "../../services/dashboardService";
import { getSurveyParticipants, getSurveys } from "../../services/surveyApi";

function formatShortDate(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function resolveTaskDueText(status, closesAt) {
    const normalizedStatus = String(status || "").toUpperCase();
    if (normalizedStatus === "STARTED") return "In progress";
    if (!closesAt) return "Open";

    const closeDate = new Date(closesAt);
    if (Number.isNaN(closeDate.getTime())) return "Open";

    const now = new Date();
    const isToday = closeDate.toDateString() === now.toDateString();
    if (isToday) return "Due today";
    return `Due ${formatShortDate(closesAt)}`;
}

export const StudentDashboard = () => {
    const { token, user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [todayTasks, setTodayTasks] = useState([]);
    const [upcomingActivities, setUpcomingActivities] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pendingSurveyCount, setPendingSurveyCount] = useState(0);

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!token) {
                if (active) {
                    setError("Missing auth session.");
                    setLoading(false);
                }
                return;
            }

            try {
                const [dashboardResponse, surveysResponse, participantsResponse] = await Promise.all([
                    getDashboardSummary(token),
                    getSurveys(),
                    getSurveyParticipants(),
                ]);
                if (!active) return;

                setDashboard(dashboardResponse || null);

                const surveyList = Array.isArray(surveysResponse) ? surveysResponse : [];
                const participantList = Array.isArray(participantsResponse) ? participantsResponse : [];
                const groupList = Array.isArray(dashboardResponse?.my_groups) ? dashboardResponse.my_groups : [];
                const recentReleases = Array.isArray(dashboardResponse?.recent_releases) ? dashboardResponse.recent_releases : [];

                const surveyTitleById = new Map(
                    surveyList.map((survey) => [String(survey?.survey_id), survey?.title || survey?.name || "Untitled Survey"])
                );

                const myTasks = participantList
                    .filter((item) => String(item?.user_id) === String(user?.user_id))
                    .filter((item) => {
                        const status = String(item?.status || "").toUpperCase();
                        return status === "INVITED" || status === "STARTED";
                    })
                    .slice(0, 5)
                    .map((item) => {
                        const surveyId = String(item?.survey_id || "");
                        return {
                            task: surveyTitleById.get(surveyId) || `Survey ${surveyId}`,
                            due: resolveTaskDueText(item?.status),
                        };
                    });

                const upcoming = recentReleases
                    .slice(0, 5)
                    .map((release) => ({
                        activity: release?.name || "Survey Release",
                        date: formatShortDate(release?.opens_at || release?.closes_at),
                    }));

                const myGroups = groupList
                    .slice(0, 6)
                    .map((group) => ({ name: group?.name || "Untitled Group" }));

                const myParticipantRows = participantList.filter((item) => String(item?.user_id) === String(user?.user_id));
                const completedSurveyIds = new Set(
                    myParticipantRows
                        .filter((item) => String(item?.status || "").toUpperCase() === "COMPLETED")
                        .map((item) => Number(item?.survey_id))
                        .filter((value) => Number.isInteger(value) && value > 0)
                );

                // Student surveys endpoint returns visible/published surveys for the user.
                const visibleSurveyIds = new Set(
                    surveyList
                        .map((item) => Number(item?.survey_id))
                        .filter((value) => Number.isInteger(value) && value > 0)
                );

                const derivedPendingCount = Array.from(visibleSurveyIds).filter((surveyId) => !completedSurveyIds.has(surveyId)).length;

                setTodayTasks(myTasks);
                setUpcomingActivities(upcoming);
                setGroups(myGroups);
                setPendingSurveyCount(derivedPendingCount);
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load dashboard data.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [token, user?.user_id]);

    const overview = dashboard?.overview || {};

    const stats = useMemo(() => [
        { name: "Surveys Completed", value: overview.my_completed || 0, icon: ClipboardList, color: "text-green-600", bg: "bg-green-50" },
        { name: "Surveys Pending", value: pendingSurveyCount, icon: ClipboardList, color: "text-yellow-600", bg: "bg-yellow-50" },
        { name: "Survey Answers", value: overview.my_answers || 0, icon: ClipboardList, color: "text-red-600", bg: "bg-red-50" },
        { name: "Tasks Allocated", value: overview.action_plans_pending || 0, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
    ], [overview, pendingSurveyCount]);

    return (
        <div className="space-y-8">
            {loading && <div className="text-sm text-gray-500">Loading dashboard...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((item) => (
                    <div key={item.name} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${item.bg}`}>
                                <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Student</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-500">{item.name}</h3>
                            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Today's Tasks */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-purple-600" /> Today's Tasks
                    </h2>
                    <ul className="space-y-2">
                        {todayTasks.map((t, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                                <span>{t.task}</span>
                                <span className="text-xs text-gray-400">{t.due}</span>
                            </li>
                        ))}
                        {!loading && todayTasks.length === 0 && (
                            <li className="text-sm text-gray-500">No pending tasks right now.</li>
                        )}
                    </ul>
                </div>
                {/* Upcoming Activities */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Activities
                    </h2>
                    <ul className="space-y-2">
                        {upcomingActivities.map((a, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                                <span>{a.activity}</span>
                                <span className="text-xs text-gray-400">{a.date}</span>
                            </li>
                        ))}
                        {!loading && upcomingActivities.length === 0 && (
                            <li className="text-sm text-gray-500">No upcoming activities.</li>
                        )}
                    </ul>
                </div>
                {/* Groups */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" /> My Groups
                    </h2>
                    <ul className="space-y-2">
                        {groups.map((g, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                                {g.name}
                            </li>
                        ))}
                        {!loading && groups.length === 0 && (
                            <li className="text-sm text-gray-500">You are not in any groups yet.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};
