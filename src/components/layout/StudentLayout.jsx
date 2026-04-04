
import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet, useLocation } from "react-router-dom";
import { STUDENT_NAV_LINKS } from "../../constants/navigationStudent";

const StudentLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isFocusedSurveyRoute = useMemo(() => /^\/student\/surveys\/[^/]+$/.test(location.pathname), [location.pathname]);

  if (isFocusedSurveyRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} navLinks={STUDENT_NAV_LINKS} />
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 min-h-0 md:ml-64">
        <Topbar setIsOpen={setIsOpen} />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
