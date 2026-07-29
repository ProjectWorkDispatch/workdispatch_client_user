import { StarRating } from "./StarRating";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";

export const ReviewCard = ({ review, direction }) => {
    const person =
        direction === "given"
            ? review.revieweredId
            : review.reviewerId;

    const fullName = `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "Usuario";

    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold">
                            {direction === "given" ? "Calificaste a" : "Te calificó"}
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{fullName}</h3>
                    </div>
                    <StarRating value={review.Rating} readOnly size="size-4" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{review.Comment}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                    {new Date(review.createdAt).toLocaleDateString()}
                </p>
            </CardContent>
        </Card>
    );
};