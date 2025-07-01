import React, { useState, useEffect } from "react";
import { ScheduleEvent } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Grid3x3,
  List,
  Clock
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import EventForm from "../components/calendar/EventForm";
import WeekView from "../components/calendar/WeekView";
import MonthView from "../components/calendar/MonthView";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week");
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await ScheduleEvent.list("-start_date");
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
    setIsLoading(false);
  };

  const handleEventSubmit = async (eventData) => {
    try {
      if (selectedEvent) {
        await ScheduleEvent.update(selectedEvent.id, eventData);
      } else {
        await ScheduleEvent.create(eventData);
      }
      await loadEvents();
      setShowEventForm(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEventForm(true);
  };

  const navigateWeek = (direction) => {
    if (direction === "prev") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const getCurrentWeekRange = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            Family Calendar
          </h1>
          <p className="text-gray-600">{getCurrentWeekRange()}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="rounded-md"
            >
              <List className="w-4 h-4 mr-1" />
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="rounded-md"
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
              Month
            </Button>
          </div>
          
          <Button 
            onClick={() => setShowEventForm(true)}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigateWeek("prev")}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigateWeek("next")}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Views */}
      {isLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg"></div>
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "week" ? (
            <WeekView 
              currentDate={currentDate}
              events={events}
              onEditEvent={handleEditEvent}
            />
          ) : (
            <MonthView 
              currentDate={currentDate}
              events={events}
              onEditEvent={handleEditEvent}
            />
          )}
        </>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          event={selectedEvent}
          onSubmit={handleEventSubmit}
          onCancel={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}