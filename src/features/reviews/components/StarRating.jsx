import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

export const StarRating = ({ value = 0, onChange, readOnly = false, size = "size-6" }) => {
    const stars = [1, 2, 3, 4, 5];

    return (
        <div className="flex items-center gap-1">
            {stars.map((star) => {
                const filled = star <= value;
                const Icon = filled ? StarSolid : StarOutline;
                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readOnly}
                        onClick={() => onChange?.(star)}
                        className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
                    >
                        <Icon className={`${size} ${filled ? "text-yellow-500" : "text-gray-300"}`} />
                    </button>
                );
            })}
        </div>
    );
};