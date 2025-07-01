
import React, { useState, useEffect } from "react";
import { Feedback, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Star, ArrowLeft } from "lucide-react";

import FeedbackList from "../components/feedback/FeedbackList";
import NewFeedbackRequestForm from "../components/feedback/NewFeedbackRequestForm";
import ParentFeedbackForm from "../components/feedback/ParentFeedbackForm";
import NannyFeedbackView from "../components/feedback/NannyFeedbackView";
import CompletedFeedbackView from "../components/feedback/CompletedFeedbackView";

export default function FeedbackPage() {
  const [feedbackCycles, setFeedbackCycles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const cycles = await Feedback.list("-due_date");
      setCurrentUser(user);
      setFeedbackCycles(cycles);
    } catch (error) {
      console.error("Error loading feedback data:", error);
    }
    setIsLoading(false);
  };

  const handleCreateRequest = async (data) => {
    try {
      await Feedback.create({
        ...data,
        status: "pending_parent"
      });
      setShowNewRequestForm(false);
      await loadData();
    } catch (error) {
      console.error("Error creating feedback request:", error);
    }
  };

  const handleParentSubmit = async (feedbackId, data) => {
    try {
      await Feedback.update(feedbackId, {
        ...data,
        status: "pending_nanny",
        feedback_date: new Date().toISOString().split('T')[0]
      });
      setSelectedCycle(null);
      await loadData();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };
  
  const handleNannySubmit = async (feedbackId, data) => {
    try {
      await Feedback.update(feedbackId, {
        ...data,
        status: "completed",
        nanny_response_date: new Date().toISOString().split('T')[0]
      });
      setSelectedCycle(null);
      await loadData();
    } catch (error) {
      console.error("Error submitting nanny response:", error);
    }
  };

  const renderContent = () => {
    if (selectedCycle) {
      const isParent = currentUser?.role_type === 'parent';
      const isNanny = currentUser?.role_type === 'nanny';
      
      if (selectedCycle.status === 'pending_parent' && isParent) {
        return <ParentFeedbackForm cycle={selectedCycle} onSubmit={handleParentSubmit} />;
      }
      
      if (selectedCycle.status === 'pending_nanny' && isNanny) {
        return <NannyFeedbackView cycle={selectedCycle} onSubmit={handleNannySubmit} />;
      }
      
      // All other states are read-only views for the current user.
      // This includes a parent viewing a 'pending_nanny' cycle, 
      // a nanny viewing a 'pending_parent' cycle, or anyone viewing a 'completed' cycle.
      return <CompletedFeedbackView cycle={selectedCycle} />;
    }
    
    return (
      <FeedbackList
        cycles={feedbackCycles}
        currentUser={currentUser}
        onSelectCycle={setSelectedCycle}
        isLoading={isLoading}
      />
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {selectedCycle ? (
              <Button variant="ghost" size="icon" onClick={() => setSelectedCycle(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Star className="w-8 h-8 text-purple-500" />
            )}
            Feedback Center
          </h1>
          <p className="text-gray-600 ml-12">
            Constructive feedback for a happy nanny share
          </p>
        </div>
        
        {!selectedCycle && currentUser?.role_type === 'parent' && (
          <Button 
            onClick={() => setShowNewRequestForm(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Feedback Request
          </Button>
        )}
      </div>
      
      {renderContent()}

      {showNewRequestForm && (
        <NewFeedbackRequestForm
          onSubmit={handleCreateRequest}
          onCancel={() => setShowNewRequestForm(false)}
        />
      )}
    </div>
  );
}
