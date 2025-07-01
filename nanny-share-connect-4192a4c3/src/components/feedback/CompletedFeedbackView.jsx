import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, isValid } from "date-fns";
import StarRating from "./StarRating";
import { Clock } from "lucide-react";

const RATING_CATEGORIES = [
  { key: "rating", label: "Overall Satisfaction" },
  { key: "communication_rating", label: "Communication" },
  { key: "punctuality_rating", label: "Punctuality" },
  { key: "childcare_quality_rating", label: "Quality of Childcare" },
];

const safeFormatDate = (dateString, formatString) => {
  if (!dateString || typeof dateString !== 'string') {
    return 'N/A';
  }
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, formatString);
    }
    return 'N/A';
  } catch (error) {
    return 'N/A';
  }
};

export default function CompletedFeedbackView({ cycle }) {
  // Handle case where feedback is waiting on parent
  if (cycle.status === 'pending_parent') {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Feedback for: {cycle.period_title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">Awaiting Parent Feedback</h3>
          <p className="text-gray-500 mt-2">
            This feedback cycle is waiting for the parent to submit their feedback.
            <br />
            Due by {safeFormatDate(cycle.due_date, "MMMM d, yyyy")}.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle case where feedback is waiting on nanny (parent view)
  const isPendingNanny = cycle.status === 'pending_nanny';

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>
          {isPendingNanny ? "Review of" : "Completed Feedback:"} {cycle.period_title}
        </CardTitle>
        {cycle.nanny_response_date && (
          <p className="text-sm text-gray-500">
            Completed on {safeFormatDate(cycle.nanny_response_date, "MMMM d, yyyy")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parent Feedback */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Parent's Feedback</h3>
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            {RATING_CATEGORIES.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{label}</span>
                <StarRating rating={cycle[key] || 0} readOnly />
              </div>
            ))}
            <div>
              <h4 className="font-semibold">What went well:</h4>
              <p className="text-gray-600 pl-2 border-l-2">{cycle.positive_feedback || "N/A"}</p>
            </div>
            <div>
              <h4 className="font-semibold">Areas for improvement:</h4>
              <p className="text-gray-600 pl-2 border-l-2">{cycle.areas_for_improvement || "N/A"}</p>
            </div>
          </div>
        </div>
        
        {/* Nanny Response */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Nanny's Response</h3>
          {isPendingNanny ? (
            <div className="p-4 bg-blue-50 rounded-lg text-center text-blue-800">
              <Clock className="w-5 h-5 inline-block mr-2" />
              Waiting for nanny to review and respond.
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-700">{cycle.nanny_response || "No response recorded."}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}