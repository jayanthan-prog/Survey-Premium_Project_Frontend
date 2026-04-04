
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";
import { APPROVER_NAV_LINKS } from "../../constants/navigationApprover";

const ApproverLayout = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} navLinks={APPROVER_NAV_LINKS} />
            <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 min-h-0 md:ml-64">
                <Topbar setIsOpen={setIsOpen} />
                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ApproverLayout;
