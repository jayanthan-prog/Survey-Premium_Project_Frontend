import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, setIsOpen, navLinks }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <div className="flex flex-col h-full">
                    {/* Branding & Close button for mobile */}
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-white tracking-tight">BIT surveys</h1>
                        <button
                            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? "bg-purple-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800 hover:text-white"}
                  `}
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.name}
                            </NavLink>
                        ))}
                    </nav>
                    {/* Logout Button */}
                    <div className="px-4 py-4 mt-auto">
                        <button
                            className="w-full flex items-center gap-2 px-4  border-red-600 hover:bg-red-700 hover:text-white text-red-600 font-semibold py-2 rounded-lg text-sm transition-colors shadow-md"
                            onClick={handleLogout}
                            aria-label="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;