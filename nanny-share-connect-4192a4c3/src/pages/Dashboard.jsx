
import React, { useState, useEffect } from "react";
import { ScheduleEvent, Message, Feedback, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calendar,
  MessageSquare,
  Star,
  Clock,
  Users,
  TrendingUp,
  CalendarDays,
  MessageCircle
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export default function Dashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const events = await ScheduleEvent.list("-start_date", 5);
      const messages = await Message.list("-created_date", 3);

      setUpcomingEvents(events);
      setRecentMessages(messages);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'work': return 'bg-green-100 text-green-800 border-green-200';
      case 'pto': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'unavailable': return 'bg-red-100 text-red-800 border-red-200';
      case 'special': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventDate = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{currentUser?.full_name ? `, ${currentUser.full_name.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-gray-600">
          {currentUser?.role_type === 'nanny'
            ? "Here's your schedule and family updates"
            : "Manage your family's care coordination"
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">This Week</CardTitle>
              <CalendarDays className="w-6 h-6 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-blue-100 text-sm">Scheduled events</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">Messages</CardTitle>
              <MessageCircle className="w-6 h-6 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMessages.length}</div>
            <p className="text-green-100 text-sm">Recent conversations</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">Family Care</CardTitle>
              <Users className="w-6 h-6 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-purple-100 text-sm">Coordination status</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Upcoming Events
              </CardTitle>
              <Link to={createPageUrl("Calendar")}>
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 mt-1">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                      <Badge variant="outline" className={getEventTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatEventDate(event.start_date)} • {event.start_time} - {event.end_time}
                    </p>
                    {event.type === 'work' && event.children_involved && event.children_involved.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-medium">{event.children_involved.join(', ')}</span>
                        </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming events</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                Recent Messages
              </CardTitle>
              <Link to={createPageUrl("Messages")}>
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMessages.length > 0 ? (
              recentMessages.map((message) => (
                <div key={message.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {message.created_by?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {message.subject && (
                        <h4 className="font-semibold text-gray-900 truncate mb-1">
                          {message.subject}
                        </h4>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {message.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(parseISO(message.created_date), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent messages</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to={createPageUrl("Calendar")}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200">
                <Calendar className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">Schedule Event</span>
              </Button>
            </Link>
            <Link to={createPageUrl("Messages")}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200">
                <MessageSquare className="w-6 h-6 text-green-500" />
                <span className="text-sm font-medium">Send Message</span>
              </Button>
            </Link>
            <Link to={createPageUrl("Feedback")}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200">
                <Star className="w-6 h-6 text-purple-500" />
                <span className="text-sm font-medium">Give Feedback</span>
              </Button>
            </Link>
            <Link to={createPageUrl("Profile")}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-200">
                <Users className="w-6 h-6 text-orange-500" />
                <span className="text-sm font-medium">Update Profile</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
