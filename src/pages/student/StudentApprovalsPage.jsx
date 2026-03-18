
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";

// Mock data for student's own survey responses
const mockApprovals = [
    { id: 1, survey: "Hostel Preference 2026", submitted: "2026-02-20", status: "Approved" },
    { id: 2, survey: "Elective Course Bidding", submitted: "2026-02-18", status: "Pending" },
    { id: 3, survey: "Internship Willingness", submitted: "2026-02-10", status: "Rejected" },
];

const statusIcon = {
    Approved: <CheckCircle className="w-5 h-5 text-green-600" />,
    Pending: <Clock className="w-5 h-5 text-yellow-500" />,
    Rejected: <XCircle className="w-5 h-5 text-red-500" />,
};

export default function StudentApprovalsPage() {
    const [search, setSearch] = useState("");
    const filtered = mockApprovals.filter(item => item.survey.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">My Survey Approvals</h1>
                <input
                    type="text"
                    placeholder="Search approvals..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filtered.map((item) => (
                    <div key={item.id} className="flex flex-col bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            {statusIcon[item.status]}
                            <span className="text-lg font-semibold text-gray-900">{item.survey}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">Submitted: {item.submitted}</div>
                        <div className="mt-auto">
                            <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase ${item.status === 'Approved' ? 'bg-green-100 text-green-700' : item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
