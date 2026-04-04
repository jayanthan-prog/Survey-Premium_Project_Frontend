import {
    LayoutDashboard, Users, UserPlus, ClipboardList, Send,
    CheckSquare, BarChart3, Calendar, Map
} from "lucide-react";

export const APPROVER_NAV_LINKS = [
    { name: "Dashboard", path: "/approver/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/approver/users", icon: Users },
    { name: "Groups", path: "/approver/groups", icon: UserPlus },
    { name: "Surveys", path: "/approver/surveys", icon: ClipboardList },
    { name: "Releases", path: "/approver/releases", icon: Send },
    { name: "Approvals", path: "/approver/approvals", icon: CheckSquare },
    { name: "Allocation", path: "/approver/allocation", icon: BarChart3 },
    { name: "Calendar", path: "/approver/calendar", icon: Calendar },
    { name: "Action Plans", path: "/approver/action-plans", icon: Map },
];
