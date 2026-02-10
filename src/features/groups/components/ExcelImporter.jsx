import * as XLSX from "xlsx";

const ExcelImporter = ({ onImport }) => {

    const handleFile = (e) => {
        const file = e.target.files[0];

        const reader = new FileReader();

        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);

            const workbook = XLSX.read(data, { type: "array" });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const json = XLSX.utils.sheet_to_json(sheet);

            onImport(json);
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <label className="inline-flex items-center justify-center rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 cursor-pointer">
            Import Excel
            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFile}
                hidden
            />
        </label>
    );
};

export default ExcelImporter;
