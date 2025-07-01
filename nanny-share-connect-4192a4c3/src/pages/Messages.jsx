import React, { useState, useEffect } from "react";
import { Message, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Plus, AlertCircle, Reply } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    is_urgent: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      const fetchedMessages = await Message.list("-created_date");
      setCurrentUser(user);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const messageData = {
        ...formData,
        reply_to_id: replyingTo?.id || null
      };
      
      await Message.create(messageData);
      setFormData({ subject: "", content: "", is_urgent: false });
      setShowNewMessage(false);
      setReplyingTo(null);
      await loadData();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setFormData({
      subject: `Re: ${message.subject || "Message"}`,
      content: "",
      is_urgent: false
    });
    setShowNewMessage(true);
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const key = message.reply_to_id || message.id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
    return groups;
  }, {});

  const conversations = Object.values(groupedMessages).map(group => {
    return group.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }).sort((a, b) => new Date(b[b.length - 1].created_date) - new Date(a[a.length - 1].created_date));

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-green-500" />
            Message Board
          </h1>
          <p className="text-gray-600">Stay connected with your nanny share family</p>
        </div>
        
        <Button 
          onClick={() => setShowNewMessage(true)}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* New Message Form */}
      {showNewMessage && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>
              {replyingTo ? `Reply to: ${replyingTo.subject || "Message"}` : "New Message"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!replyingTo && (
                <div>
                  <Input
                    placeholder="Subject (optional)"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
              )}
              
              <div>
                <Textarea
                  placeholder="Type your message..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_urgent}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_urgent: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Mark as urgent
                  </span>
                </label>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowNewMessage(false);
                      setReplyingTo(null);
                      setFormData({ subject: "", content: "", is_urgent: false });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <div className="space-y-6">
        {conversations.length > 0 ? (
          conversations.map((conversation, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {conversation.map((message, msgIndex) => (
                    <div key={message.id} className={`${msgIndex > 0 ? 'ml-8 pt-4 border-t border-gray-100' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {message.created_by?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {message.created_by || 'User'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {format(parseISO(message.created_date), "MMM d, h:mm a")}
                            </span>
                            {message.is_urgent && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                          
                          {message.subject && msgIndex === 0 && (
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {message.subject}
                            </h3>
                          )}
                          
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {message.content}
                          </p>
                          
                          {msgIndex === conversation.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReply(conversation[0])}
                              className="mt-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Reply className="w-4 h-4 mr-1" />
                              Reply
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600 mb-4">Start the conversation with your nanny share family</p>
              <Button 
                onClick={() => setShowNewMessage(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Send First Message
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}