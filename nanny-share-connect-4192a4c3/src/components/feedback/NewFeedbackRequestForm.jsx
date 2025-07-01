import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function NewFeedbackRequestForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    period_title: "",
    due_date: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg border-0 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Request New Feedback</CardTitle>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="period_title">Feedback Period Title</Label>
              <Input
                id="period_title"
                value={formData.period_title}
                onChange={(e) => setFormData(prev => ({ ...prev, period_title: e.target.value }))}
                placeholder="e.g., January 2025"
                required
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Send Request</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}