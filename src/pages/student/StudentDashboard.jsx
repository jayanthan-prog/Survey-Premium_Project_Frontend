
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

const todayTasks = [
    { task: "Submit Hostel Survey", due: "Today" },
    { task: "Attend Group Meeting", due: "5:00 PM" },
];

const upcomingActivities = [
    { activity: "Elective Course Survey", date: "Feb 28" },
    { activity: "Internship Willingness", date: "Mar 3" },
];

const groups = [
    { name: "Block A Residents" },
    { name: "Machine Learning Elective" },
];

export const StudentDashboard = () => {
    const { token } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                const response = await getDashboardSummary(token);
                if (!active) return;
                setDashboard(response);
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
    }, [token]);

    const overview = dashboard?.overview || {};

    const stats = useMemo(() => [
        { name: "Surveys Completed", value: overview.my_completed || 0, icon: ClipboardList, color: "text-green-600", bg: "bg-green-50" },
        { name: "Surveys Pending", value: (overview.my_invited || 0) + (overview.my_started || 0), icon: ClipboardList, color: "text-yellow-600", bg: "bg-yellow-50" },
        { name: "Survey Answers", value: overview.my_answers || 0, icon: ClipboardList, color: "text-red-600", bg: "bg-red-50" },
        { name: "Tasks Allocated", value: overview.action_plans_pending || 0, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
    ], [overview]);

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
                    </ul>
                </div>
            </div>
        </div>
    );
};
