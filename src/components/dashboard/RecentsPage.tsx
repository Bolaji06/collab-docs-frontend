
import { DashboardLayout } from "./DashboardLayout";
import { DocumentRow } from "./DocumentRow";
import { Loader, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { documentService, type Document } from "../../services/document-service";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";

export default function RecentsPage() {
    const { isLoading: isUserLoading } = useUserStore();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            // Recents usually means "Recently Accessed" but "Recently Updated" is a good proxy for now.
            // getAll returns sorted by updatedAt desc.
            const docs = await documentService.getAll();
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to load documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter documents based on search query
    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayDocs = filteredDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        owner: doc.owner?.username || "Me",
        date: new Date(doc.updatedAt).toLocaleString(),
        rawDate: new Date(doc.updatedAt) // for additional sorting if needed
    }));

    if (isLoading || isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 bg-opacity-60 dark:bg-[#121212]">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Recents
                </h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Your recently modified documents.
                </p>
            </div>

            <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider rounded-t-2xl">
                    <div className="pl-12">Document Name</div>
                    <div className="hidden sm:block">Owner</div>
                    <div className="hidden sm:block text-right pr-8">Last Opened</div>
                    <div className="w-10"></div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                    {displayDocs.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-zinc-500">
                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center">
                                    <Clock className="w-10 h-10 mb-4 text-gray-300 dark:text-zinc-600" />
                                    <p>No recent documents</p>
                                </div>
                            ) : (
                                <p>No documents matching "{searchQuery}"</p>
                            )}
                        </div>
                    ) : (
                        displayDocs.map((doc, index) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <DocumentRow
                                    title={doc.title}
                                    owner={doc.owner}
                                    date={doc.date}
                                    onClick={() => navigate(`/doc/${doc.id}`)}
                                />
                            </motion.div>
                        ))
                    )}
                </div>
            </section>
        </DashboardLayout>
    );
}
