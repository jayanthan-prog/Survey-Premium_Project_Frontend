import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

const StudentLayout = () => {

  const links = [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "Surveys", path: "/student/surveys" },
    { name: "My Commitments", path: "/student/commitments" },
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

export default StudentLayout;
