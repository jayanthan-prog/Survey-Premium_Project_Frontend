import {
    LayoutDashboard, Users, UserPlus, ClipboardList, Send,
    CheckSquare, FileText, BarChart3, Calendar, Map,
    PieChart, History
} from "lucide-react";

export const ADMIN_NAV_LINKS = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Groups", path: "/admin/groups", icon: UserPlus },
    { name: "Surveys", path: "/admin/surveys", icon: ClipboardList },
    { name: "Releases", path: "/admin/releases", icon: Send },
    { name: "Approvals", path: "/admin/approvals", icon: CheckSquare },
    // { name: "Documents", path: "/admin/documents", icon: FileText },
    { name: "Allocation", path: "/admin/allocation", icon: BarChart3 },
    { name: "Calendar", path: "/admin/calendar", icon: Calendar },
    { name: "Action Plans", path: "/admin/action-plans", icon: Map },
    { name: "Analytics", path: "/admin/analytics", icon: PieChart },
    { name: "Audit Logs", path: "/admin/audit-logs", icon: History },
];