import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

const ApproverLayout = () => {

    const links = [
        { name: "Dashboard", path: "/approver/dashboard" },
        { name: "Surveys", path: "/approver/surveys" },
        { name: "Pending Approvals", path: "/approver/approvals" },
    ];

    return (
        <div className="flex bg-gray-100 min-h-screen">

            <Sidebar links={links} />

            <div className="flex-1 flex flex-col">

                <Topbar />

                <div className="p-6">
                    <Outlet />
                </div>

            </div>
        </div>
    );
};

export default ApproverLayout;
