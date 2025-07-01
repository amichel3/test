import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isValid } from "date-fns";
import { Clock, CheckCircle, Send, Eye } from "lucide-react";

const getStatusInfo = (status) => {
  switch (status) {
    case 'pending_parent':
      return {
        label: "Pending Parent Feedback",
        color: "bg-orange-100 text-orange-800",
      };
    case 'pending_nanny':
      return {
        label: "Pending Nanny Response",
        color: "bg-blue-100 text-blue-800",
      };
    case 'completed':
      return {
        label: "Completed",
        color: "bg-green-100 text-green-800",
      };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800" };
  }
};

const getButtonProps = (cycle, userRole) => {
  if (userRole === 'parent' && cycle.status === 'pending_parent') {
    return { text: 'Complete Now', icon: Send };
  }
  if (userRole === 'nanny' && cycle.status === 'pending_nanny') {
    return { text: 'View & Respond', icon: Send };
  }
  if (cycle.status === 'completed') {
    return { text: 'View Details', icon: Eye };
  }
  return { text: 'View Status', icon: Eye };
};

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

export default function FeedbackList({ cycles, currentUser, onSelectCycle, isLoading }) {
  const userRole = currentUser?.role_type;
  
  const pendingCycles = cycles.filter(c => c.status !== 'completed');
  const completedCycles = cycles.filter(c => c.status === 'completed');

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded-lg w-48"></div>
            <div className="h-24 bg-gray-200 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Pending Feedback
        </h2>
        <div className="space-y-4">
          {pendingCycles.length > 0 ? (
            pendingCycles.map((cycle) => {
              const statusInfo = getStatusInfo(cycle.status);
              const buttonProps = getButtonProps(cycle, userRole);
              const ButtonIcon = buttonProps.icon;
              
              return (
                <Card key={cycle.id} className="border-0 shadow-lg">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cycle.period_title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Due: {safeFormatDate(cycle.due_date, "MMM d, yyyy")}
                      </p>
                      <Badge variant="outline" className={`mt-2 ${statusInfo.color}`}>{statusInfo.label}</Badge>
                    </div>
                    <Button onClick={() => onSelectCycle(cycle)}>
                      <ButtonIcon className="w-4 h-4 mr-2" />
                      {buttonProps.text}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-gray-500">No pending feedback cycles. Great job!</p>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Completed Feedback
        </h2>
        <div className="space-y-4">
          {completedCycles.length > 0 ? (
            completedCycles.map((cycle) => {
              const buttonProps = getButtonProps(cycle, userRole);
              const ButtonIcon = buttonProps.icon;
              return (
              <Card key={cycle.id} className="border-0 shadow-md bg-gray-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{cycle.period_title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Completed: {safeFormatDate(cycle.nanny_response_date, "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => onSelectCycle(cycle)}>
                    <ButtonIcon className="w-4 h-4 mr-2" />
                    {buttonProps.text}
                  </Button>
                </CardContent>
              </Card>
            )})
          ) : (
            <p className="text-gray-500">No completed feedback cycles yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}