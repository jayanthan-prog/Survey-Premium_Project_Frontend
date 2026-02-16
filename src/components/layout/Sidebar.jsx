import { NavLink } from "react-router-dom";
import { ADMIN_NAV_LINKS } from "../../constants/navigation";

const Sidebar = ({ isOpen, setIsOpen }) => {
    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
            <div className="flex flex-col h-full">
                {/* Branding */}
                <div className="p-4 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">Survey Me</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {ADMIN_NAV_LINKS.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? "bg-purple-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800 hover:text-white"}
              `}
                        >
                            <link.icon className="w-4 h-4" />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;