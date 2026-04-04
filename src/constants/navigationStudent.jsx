import {
    LayoutDashboard, ClipboardList, CheckSquare, BarChart3, Calendar, Map
} from "lucide-react";

export const STUDENT_NAV_LINKS = [
    { name: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { name: "Surveys", path: "/student/surveys", icon: ClipboardList },
    // { name: "Approvals", path: "/student/approvals", icon: CheckSquare },
    { name: "Allocation", path: "/student/allocation", icon: BarChart3 },
    { name: "Calendar", path: "/student/calendar", icon: Calendar },
    { name: "Action Plans", path: "/student/action-plans", icon: Map },
];
