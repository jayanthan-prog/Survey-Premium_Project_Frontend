import { useState } from "react";

const CategorySelect = () => {

    const [categories, setCategories] = useState([
        "Placement",
        "Academic",
        "Special Lab"
    ]);

    const [newCat, setNewCat] = useState("");

    const addCategory = () => {
        if (newCat) {
            setCategories([...categories, newCat]);
            setNewCat("");
        }
    };

    return (
        <div>
            <label className="text-sm font-medium text-gray-600">
                Category
            </label>

            <div className="flex gap-2 w-full">

                {/* SELECT */}
                <select className="flex-1 border rounded-lg px-3 py-2">
                    <option>Select category</option>
                    {categories.map(cat => (
                        <option key={cat}>{cat}</option>
                    ))}
                </select>

                {/* INPUT */}
                <input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="Add category"
                    className="flex-1 border px-3 py-2 rounded-lg"
                />

                {/* BUTTON */}
                <button
                    type="button"
                    onClick={addCategory}
                    className="bg-purple-600 text-white px-4 rounded-lg inline-flex items-center gap-1 whitespace-nowrap "
                >
                    + Add
                </button>

            </div>
        </div>
    );
};

export default CategorySelect;
