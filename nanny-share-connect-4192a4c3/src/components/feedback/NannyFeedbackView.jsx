import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from "./StarRating";

const RATING_CATEGORIES = [
  { key: "rating", label: "Overall Satisfaction" },
  { key: "communication_rating", label: "Communication" },
  { key: "punctuality_rating", label: "Punctuality" },
  { key: "childcare_quality_rating", label: "Quality of Childcare" },
];

export default function NannyFeedbackView({ cycle, onSubmit }) {
  const [response, setResponse] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(cycle.id, { nanny_response: response });
  };

  return (
    <Card className="border-0 shadow-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Review Feedback for: {cycle.period_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parent Feedback Display */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-800">Parent's Feedback</h3>
            {/* Ratings */}
            <div className="space-y-2">
              {RATING_CATEGORIES.map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{label}</span>
                  <StarRating rating={cycle[key]} readOnly />
                </div>
              ))}
            </div>
            {/* Comments */}
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-gray-700">What went well:</h4>
                <p className="text-gray-600 pl-2 border-l-2">{cycle.positive_feedback || "N/A"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Areas for improvement:</h4>
                <p className="text-gray-600 pl-2 border-l-2">{cycle.areas_for_improvement || "N/A"}</p>
              </div>
            </div>
          </div>
          
          {/* Nanny Response Form */}
          <div>
            <Label htmlFor="nanny_response">Your Response</Label>
            <Textarea
              id="nanny_response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
              placeholder="Acknowledge feedback and add your comments here..."
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">Submit Response & Complete</Button>
        </CardFooter>
      </form>
    </Card>
  );
}