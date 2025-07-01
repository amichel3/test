import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Phone, Users, DollarSign, Save, Plus, X } from "lucide-react";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    role_type: "",
    phone_number: "",
    emergency_contact: "",
    children_names: [],
    pay_rate: "",
    pay_period: "weekly"
  });
  const [newChildName, setNewChildName] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setFormData({
        role_type: user.role_type || "",
        phone_number: user.phone_number || "",
        emergency_contact: user.emergency_contact || "",
        children_names: user.children_names || [],
        pay_rate: user.pay_rate || "",
        pay_period: user.pay_period || "weekly"
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await User.updateMyUserData(formData);
      await loadUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
    setIsSaving(false);
  };

  const addChild = () => {
    if (newChildName.trim()) {
      setFormData(prev => ({
        ...prev,
        children_names: [...prev.children_names, newChildName.trim()]
      }));
      setNewChildName("");
    }
  };

  const removeChild = (index) => {
    setFormData(prev => ({
      ...prev,
      children_names: prev.children_names.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserIcon className="w-8 h-8 text-purple-500" />
          Profile Settings
        </h1>
        <p className="text-gray-600">Manage your account and family information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {currentUser?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{currentUser?.full_name}</h3>
                <p className="text-sm text-gray-600">{currentUser?.email}</p>
                {formData.role_type && (
                  <Badge variant="outline" className="mt-1">
                    {formData.role_type === 'nanny' ? 'Nanny' : 'Parent'}
                  </Badge>
                )}
              </div>
            </div>
            
            {formData.children_names.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Children</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.children_names.map((name, index) => (
                    <Badge key={index} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Update Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selection */}
                <div>
                  <Label htmlFor="role_type">Role</Label>
                  <Select 
                    value={formData.role_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="nanny">Nanny</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergency_contact">Emergency Contact</Label>
                    <Input
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                      placeholder="Emergency contact info"
                    />
                  </div>
                </div>

                {/* Children (for parents) */}
                {formData.role_type === 'parent' && (
                  <div>
                    <Label>Children Names</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newChildName}
                          onChange={(e) => setNewChildName(e.target.value)}
                          placeholder="Enter child's name"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChild())}
                        />
                        <Button type="button" onClick={addChild} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {formData.children_names.map((name, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {name}
                            <button
                              type="button"
                              onClick={() => removeChild(index)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information (for parents) */}
                {formData.role_type === 'parent' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pay_rate">Hourly Pay Rate</Label>
                      <Input
                        id="pay_rate"
                        type="number"
                        step="0.01"
                        value={formData.pay_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, pay_rate: e.target.value }))}
                        placeholder="25.00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pay_period">Pay Period</Label>
                      <Select 
                        value={formData.pay_period} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, pay_period: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}