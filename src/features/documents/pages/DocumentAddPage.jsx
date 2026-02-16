import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DocumentAddPage = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [docType, setDocType] = useState("");
    const [relatedTo, setRelatedTo] = useState("");
    const [visibility, setVisibility] = useState("Internal");
    const [notes, setNotes] = useState("");
    const [fileName, setFileName] = useState("");

    const inputClassName =
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none";
    const labelClassName = "text-xs font-medium text-gray-500";

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            title,
            type: docType,
            relatedTo,
            visibility,
            notes,
            fileName,
        };

        console.log("Add document", payload);
        navigate("/admin/documents");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Add Document</h1>
                    <div className="text-sm text-gray-500">Upload a document and send it for review.</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/documents")}
                        className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="document-add-form"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        Save Document
                    </button>
                </div>
            </div>

            <form id="document-add-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-semibold text-gray-800">Document Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClassName}>Title</label>
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className={inputClassName}
                                placeholder="Consent Form"
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClassName}>Document Type</label>
                            <select
                                value={docType}
                                onChange={(event) => setDocType(event.target.value)}
                                className={inputClassName}
                                required
                            >
                                <option value="">Select type</option>
                                <option value="PDF">PDF</option>
                                <option value="Image">Image</option>
                                <option value="Spreadsheet">Spreadsheet</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClassName}>Related Survey/Release</label>
                            <input
                                value={relatedTo}
                                onChange={(event) => setRelatedTo(event.target.value)}
                                className={inputClassName}
                                placeholder="Hostel Preference 2026"
                            />
                        </div>
                        <div>
                            <label className={labelClassName}>Visibility</label>
                            <select
                                value={visibility}
                                onChange={(event) => setVisibility(event.target.value)}
                                className={inputClassName}
                            >
                                <option value="Internal">Internal</option>
                                <option value="Approver">Approver Only</option>
                                <option value="Student">Student</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClassName}>Notes</label>
                            <textarea
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                className={inputClassName}
                                rows="3"
                                placeholder="Add any review notes or context"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClassName}>File</label>
                            <input
                                type="file"
                                onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
                                className={inputClassName}
                                required
                            />
                            {fileName && (
                                <div className="text-xs text-gray-500 mt-1">Selected: {fileName}</div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DocumentAddPage;
