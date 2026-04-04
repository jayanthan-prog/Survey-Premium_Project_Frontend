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
import UserProfilePage from "../features/users/pages/UserProfilePage";
import MyProfilePage from "../features/users/pages/MyProfilePage";
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

// --- STUDENT PAGES (Based on SRS Page 7/8 - Section 13) ---
import { StudentDashboard } from "../pages/student/StudentDashboard";
import StudentSurveysPage from "../pages/student/StudentSurveysPage";
import TakeSurveyPage from "../pages/student/TakeSurveyPage";
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
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <ApproverDashboard /> },
            { path: "users", element: <UsersModule /> },
            { path: "users/create", element: <AddUserPage /> },
            { path: "users/:id", element: <UserProfilePage /> },
            { path: "profile", element: <MyProfilePage /> },
            { path: "groups", element: <GroupsModule /> },
            { path: "groups/create", element: <GroupBuilderPage /> },
            { path: "groups/:id/edit", element: <GroupBuilderPage /> },
            { path: "surveys", element: <SurveysModule /> },
            { path: "surveys/create", element: <Navigate to="/admin/surveys/builder/new" replace /> },
            { path: "surveys/builder/:surveyId", element: <SurveyBuilderPage /> },
            { path: "surveys/preview", element: <SurveyPreviewPage /> },
            { path: "surveys/report/:id", element: <SurveyReportPage /> },
            { path: "releases", element: <ReleasesModule /> },
            { path: "releases/:id/edit", element: <SurveyBuilderPage /> },
            { path: "approvals", element: <ApprovalsModule mode="admin" /> },
            { path: "documents", element: <DocumentsModule /> },
            { path: "allocation", element: <AllocationModule /> },
            { path: "allocation/create", element: <AllocationAddPage /> },
            { path: "documents/create", element: <DocumentAddPage /> },
            { path: "documents/:id", element: <DocumentViewPage /> },
            { path: "calendar", element: <CalendarModule /> },
            { path: "action-plans", element: <ActionPlansModule /> },
            { path: "analytics", element: <AnalyticsModule /> },
            { path: "audit-logs", element: <AuditLogsModule /> },
        ],
    },

    // ==========================================
    // 🔥 STUDENT ROUTES (User Experience Guarantees)
    // ==========================================
    {
        path: "/student",
        element: (
            <ProtectedRoute allowedRoles={["USER", "STUDENT"]}>
                <StudentLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <StudentDashboard /> },
            { path: "surveys", element: <StudentSurveysPage /> },
            { path: "surveys/:id", element: <TakeSurveyPage /> },
            { path: "profile", element: <MyProfilePage /> },
            // { path: "approvals", element: <StudentApprovalsPage /> },
            { path: "allocation", element: <AllocationModule /> },
            { path: "calendar", element: <CalendarModule /> },
            { path: "action-plans", element: <ActionPlansModule /> },
        ],
    },

    // ==========================================
    // 🔥 APPROVER ROUTES (Reuse Admin UI, Data Changes Only)
    // ==========================================
    {
        path: "/approver",
        element: (
            <ProtectedRoute allowedRoles={["APPROVER"]}>
                <ApproverLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <AdminDashboard /> },
            { path: "users", element: <UsersModule /> },
            { path: "users/create", element: <AddUserPage /> },
            { path: "users/:id", element: <UserProfilePage /> },
            { path: "profile", element: <MyProfilePage /> },
            { path: "groups", element: <GroupsModule /> },
            { path: "groups/create", element: <GroupBuilderPage /> },
            { path: "groups/:id/edit", element: <GroupBuilderPage /> },
            { path: "surveys", element: <SurveysModule /> },
            { path: "surveys/create", element: <Navigate to="/approver/surveys/builder/new" replace /> },
            { path: "surveys/builder/:surveyId", element: <SurveyBuilderPage /> },
            { path: "surveys/preview", element: <SurveyPreviewPage /> },
            { path: "surveys/report/:id", element: <SurveyReportPage /> },
            { path: "releases", element: <ReleasesModule /> },
            { path: "releases/:id/edit", element: <SurveyBuilderPage /> },
            { path: "approvals", element: <ApprovalsModule mode="approver" /> },
            { path: "allocation", element: <AllocationModule /> },
            { path: "allocation/create", element: <AllocationAddPage /> },
            { path: "calendar", element: <CalendarModule /> },
            { path: "action-plans", element: <ActionPlansModule /> },
            // Note: Analytics and Audit Logs are intentionally omitted for approver
        ],
    },
]);

export default router;