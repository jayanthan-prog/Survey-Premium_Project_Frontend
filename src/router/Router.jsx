import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import StudentLayout from "../components/layout/StudentLayout";
import ApproverLayout from "../components/layout/ApproverLayout";
import ProtectedRoute from "../components/ProtectedRoute";

// Auth & General
import Login from "../pages/Login";
import { Unauthorized } from "../pages/Unauthorized";

// --- ADMIN PAGES (Based on SRS Page 54) ---
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import UsersModule from "../features/users/UsersModule";
import AddUserPage from "../features/users/pages/AddUserPage";
import GroupsModule from "../features/groups/GroupsModule";
import SurveysModule from "../features/surveys/SurveysModule";
import SurveyBuilderPage from "../features/surveys/pages/SurveyBuilderPage";
import SurveyPreviewPage from "../features/surveys/pages/SurveyPreviewPage";
import SurveyReportPage from "../features/surveys/pages/SurveyReportPage";
import ReleasesModule from "../features/releases/ReleasesModule";
import ApprovalsModule from "../features/approvals/ApprovalsModule";
import DocumentsModule from "../features/documents/DocumentsModule";
import AllocationModule from "../features/allocation/AllocationModule";
import CalendarModule from "../features/calendar/CalendarModule";
import DocumentAddPage from "../features/documents/pages/DocumentAddPage";
import DocumentViewPage from "../features/documents/pages/DocumentViewPage";
import AllocationAddPage from "../features/allocation/pages/AllocationAddPage";
import { ActionPlansModule } from "../features/action-plans/ActionPlansModule";
import AnalyticsModule from "../features/analytics/AnalyticsModule";
import AuditLogsModule from "../features/audit-logs/AuditLogsModule";
import SettingsModule from "../features/settings/SettingsModule";

// --- STUDENT PAGES (Based on SRS Page 7/8 - Section 13) ---
import { StudentDashboard } from "../pages/student/StudentDashboard";
// Component for "My Commitments" (Section 13.2)
// Component for taking surveys

// --- APPROVER PAGES (Based on SRS Page 30/60) ---
import { ApproverDashboard } from "../pages/approver/ApproverDashboard";
import GroupBuilderPage from "../features/groups/pages/GroupBuilder";
// Component for the Approval Inbox (Section 6.1)

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/login" />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/unauthorized",
        element: <Unauthorized />,
    },

    // ==========================================
    // 🔥 ADMIN ROUTES (The Full 13-Module Suite)
    // ==========================================
    {
        path: "/admin",
        element: (
            <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "dashboard", element: <AdminDashboard /> },
            { path: "users", element: <UsersModule /> },
            { path: "users/create", element: <AddUserPage /> },
            { path: "groups", element: <GroupsModule /> },
            { path: "groups/create", element: <GroupBuilderPage /> },
            { path: "surveys", element: <SurveysModule /> },
            { path: "surveys/create", element: <SurveyBuilderPage /> },
            { path: "surveys/preview", element: <SurveyPreviewPage /> },
            { path: "surveys/report/:id", element: <SurveyReportPage /> },
            { path: "releases", element: <ReleasesModule /> },
            { path: "releases/:id/edit", element: <SurveyBuilderPage /> },
            { path: "approvals", element: <ApprovalsModule /> },
            { path: "documents", element: <DocumentsModule /> },
            { path: "allocation", element: <AllocationModule /> },
            { path: "allocation/create", element: <AllocationAddPage /> },
            { path: "documents/create", element: <DocumentAddPage /> },
            { path: "documents/:id", element: <DocumentViewPage /> },
            { path: "calendar", element: <CalendarModule /> },
            { path: "action-plans", element: <ActionPlansModule /> },
            { path: "analytics", element: <AnalyticsModule /> },
            { path: "audit-logs", element: <AuditLogsModule /> },
            { path: "settings", element: <SettingsModule /> },
        ],
    },

    // ==========================================
    // 🔥 STUDENT ROUTES (User Experience Guarantees)
    // ==========================================
    {
        path: "/student",
        element: (
            <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "dashboard", element: <StudentDashboard /> },
            // Section 13: "My Commitments" dashboard
            { path: "commitments", element: <div>My Commitments Dashboard</div> },
            // Where students actually take the surveys
            { path: "survey/:id", element: <div>Survey Interface</div> },
        ],
    },

    // ==========================================
    // 🔥 APPROVER ROUTES (Verification & Review)
    // ==========================================
    {
        path: "/approver",
        element: (
            <ProtectedRoute allowedRoles={["APPROVER"]}>
                <ApproverLayout />
            </ProtectedRoute>
        ),
        children: [
            { path: "dashboard", element: <ApproverDashboard /> },
            { path: "groups/create", element: <GroupBuilderPage /> },
            { path: "surveys", element: <SurveysModule /> },
            { path: "surveys/create", element: <SurveyBuilderPage /> },
            { path: "surveys/preview", element: <SurveyPreviewPage /> },
            { path: "surveys/report/:id", element: <SurveyReportPage /> },
            { path: "releases/:id/edit", element: <SurveyBuilderPage /> },
            // Section 6: Unified Approval Queue
            { path: "queue", element: <div>Verification Queue</div> },
            // Section 7: Document Repository access
            { path: "documents", element: <div>Document Repository</div> },
        ],
    },
]);

export default router;