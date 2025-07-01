import React, { useState, useEffect } from "react";
import { Contract, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Plus, 
  Upload, 
  Calendar, 
  DollarSign, 
  Clock, 
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit3
} from "lucide-react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    contract_title: "",
    start_date: "",
    end_date: "",
    base_hourly_rate: "",
    overtime_rate: "",
    vacation_days: "",
    sick_days: "",
    contract_terms: "",
    additional_benefits: "",
    file_url: "",
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const fetchedContracts = await Contract.list("-created_date");
      setCurrentUser(user);
      setContracts(fetchedContracts);
    } catch (error) {
      console.error("Error loading contracts:", error);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploadingFile(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert('Error uploading file. Please try again.');
    }
    setUploadingFile(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const contractData = {
        ...formData,
        base_hourly_rate: parseFloat(formData.base_hourly_rate) || 0,
        overtime_rate: parseFloat(formData.overtime_rate) || 0,
        vacation_days: parseInt(formData.vacation_days) || 0,
        sick_days: parseInt(formData.sick_days) || 0
      };

      if (editingContract) {
        await Contract.update(editingContract.id, contractData);
      } else {
        await Contract.create(contractData);
      }

      setShowForm(false);
      setEditingContract(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error saving contract:", error);
      alert('Error saving contract. Please try again.');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      contract_title: contract.contract_title || "",
      start_date: contract.start_date || "",
      end_date: contract.end_date || "",
      base_hourly_rate: contract.base_hourly_rate?.toString() || "",
      overtime_rate: contract.overtime_rate?.toString() || "",
      vacation_days: contract.vacation_days?.toString() || "",
      sick_days: contract.sick_days?.toString() || "",
      contract_terms: contract.contract_terms || "",
      additional_benefits: contract.additional_benefits || "",
      file_url: contract.file_url || "",
      is_active: contract.is_active ?? true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      contract_title: "",
      start_date: "",
      end_date: "",
      base_hourly_rate: "",
      overtime_rate: "",
      vacation_days: "",
      sick_days: "",
      contract_terms: "",
      additional_benefits: "",
      file_url: "",
      is_active: true
    });
  };

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate || typeof endDate !== 'string') return null;
    try {
      const parsedDate = parseISO(endDate);
      if (!isValid(parsedDate)) return null;
      return differenceInDays(parsedDate, new Date());
    } catch {
      return null;
    }
  };

  const getExpiryStatus = (daysUntilExpiry) => {
    if (daysUntilExpiry === null) return { color: "bg-gray-100 text-gray-800", text: "No expiry set" };
    if (daysUntilExpiry < 0) return { color: "bg-red-100 text-red-800", text: "Expired" };
    if (daysUntilExpiry <= 30) return { color: "bg-orange-100 text-orange-800", text: "Expiring soon" };
    if (daysUntilExpiry <= 90) return { color: "bg-yellow-100 text-yellow-800", text: "Renewal needed" };
    return { color: "bg-green-100 text-green-800", text: "Active" };
  };

  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      return isValid(parsedDate) ? format(parsedDate, "MMM d, yyyy") : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            Contracts Management
          </h1>
          <p className="text-gray-600">Manage nanny share contracts and track renewal dates</p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Contract Form */}
      {showForm && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>
              {editingContract ? "Edit Contract" : "Create New Contract"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_title">Contract Title</Label>
                  <Input
                    id="contract_title"
                    value={formData.contract_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_title: e.target.value }))}
                    placeholder="e.g., Nanny Share Agreement 2024"
                    required
                  />
                </div>
                
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="end_date">End Date (Expiry)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="base_hourly_rate">Base Hourly Rate ($)</Label>
                  <Input
                    id="base_hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.base_hourly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_hourly_rate: e.target.value }))}
                    placeholder="25.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="overtime_rate">Overtime Rate ($)</Label>
                  <Input
                    id="overtime_rate"
                    type="number"
                    step="0.01"
                    value={formData.overtime_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, overtime_rate: e.target.value }))}
                    placeholder="37.50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vacation_days">Vacation Days</Label>
                  <Input
                    id="vacation_days"
                    type="number"
                    value={formData.vacation_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, vacation_days: e.target.value }))}
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sick_days">Sick Days</Label>
                  <Input
                    id="sick_days"
                    type="number"
                    value={formData.sick_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, sick_days: e.target.value }))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contract_terms">Contract Terms</Label>
                <Textarea
                  id="contract_terms"
                  value={formData.contract_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_terms: e.target.value }))}
                  placeholder="Key terms and conditions of the contract..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="additional_benefits">Additional Benefits</Label>
                <Textarea
                  id="additional_benefits"
                  value={formData.additional_benefits}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_benefits: e.target.value }))}
                  placeholder="Health insurance, transportation allowance, etc..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="contract_file">Contract PDF File</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      id="contract_file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="flex-1"
                    />
                    {uploadingFile && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                  {formData.file_url && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">PDF uploaded successfully</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.file_url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingContract(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  {isSubmitting ? "Saving..." : (editingContract ? "Update Contract" : "Create Contract")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contracts List */}
      <div className="space-y-4">
        {contracts.length > 0 ? (
          contracts.map((contract) => {
            const daysUntilExpiry = getDaysUntilExpiry(contract.end_date);
            const expiryStatus = getExpiryStatus(daysUntilExpiry);
            
            return (
              <Card key={contract.id} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {contract.contract_title}
                        </h3>
                        <Badge variant="outline" className={expiryStatus.color}>
                          {expiryStatus.text}
                        </Badge>
                        {!contract.is_active && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="text-sm font-medium">
                              {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                            <p className="text-sm font-medium">${contract.base_hourly_rate}/hr</p>
                          </div>
                        </div>
                        
                        {daysUntilExpiry !== null && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">
                                {daysUntilExpiry < 0 ? "Expired" : "Days Until Expiry"}
                              </p>
                              <p className="text-sm font-medium">
                                {daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)} days ago` : `${daysUntilExpiry} days`}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <div>
                            <p className="text-xs text-gray-500">Benefits</p>
                            <p className="text-sm font-medium">
                              {contract.vacation_days || 0} vacation, {contract.sick_days || 0} sick days
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {contract.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(contract.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          View PDF
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(contract)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  {contract.contract_terms && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Contract Terms</h4>
                      <p className="text-sm text-gray-600">{contract.contract_terms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts yet</h3>
              <p className="text-gray-600 mb-4">Create your first nanny share contract to get started</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Contract
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Renewal Reminders */}
      {contracts.some(c => {
        const days = getDaysUntilExpiry(c.end_date);
        return days !== null && days <= 90 && days >= 0;
      }) && (
        <Card className="border-0 shadow-lg bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Contract Renewal Reminders</h3>
                <div className="space-y-2">
                  {contracts
                    .filter(c => {
                      const days = getDaysUntilExpiry(c.end_date);
                      return days !== null && days <= 90 && days >= 0;
                    })
                    .map(contract => {
                      const days = getDaysUntilExpiry(contract.end_date);
                      return (
                        <p key={contract.id} className="text-sm text-orange-800">
                          <strong>{contract.contract_title}</strong> expires in {days} days ({formatDate(contract.end_date)})
                        </p>
                      );
                    })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}