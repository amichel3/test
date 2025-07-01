import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ rating, setRating, readOnly = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 transition-colors ${
            readOnly ? '' : 'cursor-pointer'
          } ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          onClick={() => !readOnly && setRating(star)}
        />
      ))}
    </div>
  );
}