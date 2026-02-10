import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AdminLayout = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-h-0">
                <Topbar setIsOpen={setIsOpen} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;