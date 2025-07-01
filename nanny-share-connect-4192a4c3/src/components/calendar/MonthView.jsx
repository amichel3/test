import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from "date-fns";
import { Clock, Users } from "lucide-react";

const EVENT_TYPE_COLORS = {
  work: "bg-green-500",
  pto: "bg-blue-500",
  unavailable: "bg-red-500",
  special: "bg-purple-500"
};

const EVENT_TYPE_LABELS = {
  work: "Work",
  pto: "PTO", 
  unavailable: "Unavailable",
  special: "Special"
};

export default function MonthView({ currentDate, events, onEditEvent }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-3 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={index}
                className={`min-h-[180px] p-3 border rounded-xl ${
                  isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-semibold mb-3 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-2">
                  {dayEvents.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="p-2 rounded-lg cursor-pointer hover:shadow-sm transition-all duration-200 border border-gray-100"
                      style={{ backgroundColor: `${EVENT_TYPE_COLORS[event.type]}15` }}
                      onClick={() => onEditEvent(event)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EVENT_TYPE_COLORS[event.type] }}
                        />
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {event.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {event.start_time} - {event.end_time}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1.5 py-0.5"
                          style={{ 
                            borderColor: EVENT_TYPE_COLORS[event.type],
                            color: EVENT_TYPE_COLORS[event.type]
                          }}
                        >
                          {EVENT_TYPE_LABELS[event.type]}
                        </Badge>
                        
                        {event.type === 'work' && event.children_involved && event.children_involved.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500 truncate max-w-[60px]">
                              {event.children_involved.length === 1 
                                ? event.children_involved[0]
                                : `${event.children_involved.length} kids`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length > 4 && (
                    <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 rounded">
                      +{dayEvents.length - 4} more events
                    </div>
                  )}
                  
                  {dayEvents.length === 0 && isCurrentMonth && (
                    <div className="text-center py-8">
                      <span className="text-xs text-gray-300">No events</span>
                    </div>
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