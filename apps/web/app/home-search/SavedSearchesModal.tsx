import { useState } from "react";
import { SavedSearch } from "./hooks/useSavedSearches";

type SavedSearchesModalProps = {
    isOpen: boolean;
    onClose: () => void;
    savedSearches: SavedSearch[];
    onLoad: (params: string) => void;
    onDelete: (id: string) => void;
};

export function SavedSearchesModal({
    isOpen,
    onClose,
    savedSearches,
    onLoad,
    onDelete,
}: SavedSearchesModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <h2 className="text-xl font-serif text-stone-900">Saved Searches</h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4">
                    {savedSearches.length === 0 ? (
                        <div className="text-center py-10 text-stone-500">
                            <p>You haven't saved any searches yet.</p>
                            <p className="text-sm mt-2">
                                Set up your filters and click "Save search" to quickly access them later.
                            </p>
                        </div>
                    ) : (
                        savedSearches.map((search) => (
                            <div
                                key={search.id}
                                className="group relative bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-300 hover:shadow-sm transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-stone-900">{search.name}</h3>
                                        <p className="text-sm text-stone-500 mt-1">{search.filtersSummary}</p>
                                        <p className="text-xs text-stone-400 mt-2">
                                            Saved {new Date(search.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onDelete(search.id)}
                                        className="ml-4 p-2 text-stone-400 hover:text-rose-500 transition-colors rounded-full hover:bg-stone-50"
                                        title="Delete search"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        onLoad(search.params);
                                        onClose();
                                    }}
                                    className="mt-4 w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 text-sm font-medium rounded-lg transition-colors"
                                >
                                    Load Search
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export function SaveSearchDialog({
    isOpen,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}) {
    const [name, setName] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-2">Name this search</h2>
                    <p className="text-sm text-stone-500 mb-4">
                        Give your search a name so you can easily find it later.
                    </p>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Westport Waterfront"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent mb-4"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && name.trim()) {
                                onSave(name);
                                setName("");
                            } else if (e.key === "Escape") {
                                onClose();
                            }
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-900"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (name.trim()) {
                                    onSave(name);
                                    setName("");
                                }
                            }}
                            disabled={!name.trim()}
                            className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Search
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
