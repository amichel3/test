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

export default function ParentFeedbackForm({ cycle, onSubmit }) {
  const [formData, setFormData] = useState({
    rating: cycle.rating || 0,
    communication_rating: cycle.communication_rating || 0,
    punctuality_rating: cycle.punctuality_rating || 0,
    childcare_quality_rating: cycle.childcare_quality_rating || 0,
    positive_feedback: cycle.positive_feedback || "",
    areas_for_improvement: cycle.areas_for_improvement || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(cycle.id, formData);
  };
  
  const setRatingForKey = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="border-0 shadow-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Submit Feedback for: {cycle.period_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ratings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Ratings</h3>
            {RATING_CATEGORIES.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <Label>{label}</Label>
                <StarRating rating={formData[key]} setRating={(value) => setRatingForKey(key, value)} />
              </div>
            ))}
          </div>

          {/* Text Feedback */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="positive_feedback">What went well?</Label>
              <Textarea
                id="positive_feedback"
                value={formData.positive_feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, positive_feedback: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="areas_for_improvement">Areas for improvement?</Label>
              <Textarea
                id="areas_for_improvement"
                value={formData.areas_for_improvement}
                onChange={(e) => setFormData(prev => ({ ...prev, areas_for_improvement: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">Submit Feedback</Button>
        </CardFooter>
      </form>
    </Card>
  );
}