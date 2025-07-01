
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities"; // Assuming this path is correct for your project
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Repeat, Users } from "lucide-react";

const EVENT_TYPES = [
  { value: "work", label: "Work Schedule", color: "bg-green-100 text-green-800" },
  { value: "pto", label: "PTO/Vacation", color: "bg-blue-100 text-blue-800" },
  { value: "unavailable", label: "Unavailable", color: "bg-red-100 text-red-800" },
  { value: "special", label: "Special Event", color: "bg-purple-100 text-purple-800" }
];

const RECURRING_PATTERNS = [
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" }
];

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" }
];

export default function EventForm({ event, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    type: event?.type || "work",
    start_date: event?.start_date || "",
    end_date: event?.end_date || "",
    start_time: event?.start_time || "09:00",
    end_time: event?.end_time || "17:00",
    is_recurring: event?.is_recurring || false,
    recurring_pattern: event?.recurring_pattern || "weekly",
    recurring_days: event?.recurring_days || [],
    notes: event?.notes || "",
    children_involved: event?.children_involved || []
  });
  const [allChildren, setAllChildren] = useState([]);

  useEffect(() => {
    const fetchChildren = async () => {
        try {
            // Assuming User.list() fetches all users and each parent user has a children_names array
            const users = await User.list(); 
            const parentUsers = users.filter(u => u.role_type === 'parent');
            const children = parentUsers.flatMap(p => p.children_names || []);
            const uniqueChildren = [...new Set(children)];
            setAllChildren(uniqueChildren);
        } catch (error) {
            console.error("Error fetching children list:", error);
            // Optionally, handle error state or display a message
        }
    };

    fetchChildren();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleRecurringDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      recurring_days: prev.recurring_days.includes(day)
        ? prev.recurring_days.filter(d => d !== day)
        : [...prev.recurring_days, day]
    }));
  };

  const handleChildToggle = (childName) => {
    setFormData(prev => ({
        ...prev,
        children_involved: prev.children_involved.includes(childName)
            ? prev.children_involved.filter(c => c !== childName)
            : [...prev.children_involved, childName]
    }));
  };

  const selectedEventType = EVENT_TYPES.find(type => type.value === formData.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              {event ? "Edit Event" : "Create New Event"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={type.color}>
                            {type.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'work' && allChildren.length > 0 && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    Children Involved
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                    {allChildren.map((child) => (
                      <Badge
                        key={child}
                        variant={formData.children_involved.includes(child) ? "default" : "outline"}
                        className="cursor-pointer text-base py-1"
                        onClick={() => handleChildToggle(child)}
                      >
                        {child}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date (optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
                />
                <Label htmlFor="is_recurring" className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Recurring Event
                </Label>
              </div>

              {formData.is_recurring && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Repeat Pattern</Label>
                    <Select 
                      value={formData.recurring_pattern} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_pattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRING_PATTERNS.map((pattern) => (
                          <SelectItem key={pattern.value} value={pattern.value}>
                            {pattern.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurring_pattern === "weekly" && (
                    <div>
                      <Label>Days of Week</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <Badge
                            key={day.value}
                            variant={formData.recurring_days.includes(day.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleRecurringDayToggle(day.value)}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                {event ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
