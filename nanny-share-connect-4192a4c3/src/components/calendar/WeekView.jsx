
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { Clock, Edit3, Users } from "lucide-react";

const EVENT_TYPE_COLORS = {
  work: "bg-green-100 text-green-800 border-green-200",
  pto: "bg-blue-100 text-blue-800 border-blue-200",
  unavailable: "bg-red-100 text-red-800 border-red-200",
  special: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function WeekView({ currentDate, events, onEditEvent }) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className="min-h-[400px] bg-white">
                <div className={`p-4 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <h3 className={`font-semibold text-center ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(day, 'EEE')}
                  </h3>
                  <p className={`text-sm text-center mt-1 ${isToday ? 'text-blue-500' : 'text-gray-500'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                
                <div className="p-2 space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group relative p-3 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => onEditEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {event.start_time} - {event.end_time}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${EVENT_TYPE_COLORS[event.type]} text-xs mt-2`}
                          >
                            {event.type}
                          </Badge>
                          {event.type === 'work' && event.children_involved && event.children_involved.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                                <Users className="w-3 h-3" />
                                <span className="text-xs font-medium">{event.children_involved.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(event);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">
                      No events
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
