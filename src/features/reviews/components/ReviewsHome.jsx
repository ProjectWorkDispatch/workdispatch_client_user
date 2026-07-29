// client-user/src/features/reviews/components/ReviewsHome.jsx  (ARCHIVO NUEVO)
import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "../../auth/store/authStore";
import { useReviewsStore } from "../../../shared/store/userStore";
import { ReviewCard } from "./ReviewCard";

export const ReviewsHome = () => {
    const { user } = useAuthStore();
    const currentUserId = user?._id || user?.id;

    const { given, received, loading, getGivenReviews, getReceivedReviews } = useReviewsStore();
    const [tab, setTab] = useState("received");

    useEffect(() => {
        if (!currentUserId) return;
        getGivenReviews(currentUserId);
        getReceivedReviews(currentUserId);
    }, [currentUserId]);

    const list = tab === "received" ? received : given;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100">Mis Reseñas</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Reseñas que has dejado y que has recibido</p>
            </div>

            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {[
                    { key: "received", label: "Recibidas" },
                    { key: "given", label: "Dadas" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                            tab === t.key
                                ? "border-yellow-500 text-gray-900 dark:text-gray-100"
                                : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && list.length === 0 && (
                <div className="py-16 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center gap-2">
                    <StarIcon className="size-10" />
                    {tab === "received" ? "Aún no has recibido reseñas" : "Aún no has dejado reseñas"}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((review) => (
                    <ReviewCard key={review._id} review={review} direction={tab} />
                ))}
            </div>
        </div>
    );
};