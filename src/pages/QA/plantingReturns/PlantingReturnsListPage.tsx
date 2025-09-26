import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Download, Edit, Eye, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { PlantingReturnsForm } from './components/PlantingReturnForm';
import { PlantingReturnDetails } from './components/PlantingReturnDetails';

type PlantingReturns = {
  id: string | number;
  companyName: string;
  companyAddress: string;
  companyTelephone: string;
  amountEnclosed: string;
  paymentReceipt?: string;
  registeredSeedMerchant: string;
  subGrowersFile?: string;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};


// Application List Component
const PlantingReturnsList = ({
  applications,
  onAddApplication,
  onEditApplication,
  onDeleteApplication,
  onViewApplication,
  searchTerm,
  onSearchChange,
  deletingApplicationId
}: {
  applications: PlantingReturns[];
  onAddApplication: () => void;
  onEditApplication: (app: PlantingReturns) => void;
  onDeleteApplication: (app: PlantingReturns) => void;
  onViewApplication: (app: PlantingReturns) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  deletingApplicationId: string | null;
}) => {
  const filteredApplications = applications.filter(app =>
    app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.registeredSeedMerchant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Planting Returns</h2>
          <Button onClick={onAddApplication} size="sm">
            <Plus size={16} className="mr-2" />
            New Application
          </Button>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className=" pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seed Merchant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <tr key={application.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{application.companyName}</div>
                    <div className="text-sm text-gray-500">{application.companyTelephone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  UGX {parseInt(application.amountEnclosed).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {application.registeredSeedMerchant}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    application.status === 'Approved' 
                      ? 'bg-green-100 text-green-800' 
                      : application.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {application.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {application.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewApplication(application)}
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditApplication(application)}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteApplication(application)}
                      disabled={String(deletingApplicationId) === String(application.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1" />
                      {String(deletingApplicationId) === String(application.id) ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Applications List Skeleton
const PlantingReturnsListSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-9 w-32" />
    </div>
    <div className="px-6 py-4">
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);



// Main Component with static list and dialog-based editing
const PlantingReturnsListPage = () => {
  const [applications, setApplications] = useState<PlantingReturns[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingApplicationId, setDeletingApplicationId] = useState<string | null>(null);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailOpen] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<PlantingReturns | null>(null);

  // Sample data
  useEffect(() => {
    setApplications([
      {
        id: '1',
        companyName: 'Green Valley Seeds Ltd',
        companyAddress: '123 Agricultural Lane, Farm City, FC 12345',
        companyTelephone: '+256-123-456-789',
        amountEnclosed: '50000',
        registeredSeedMerchant: 'AgriCorp International',
        paymentReceipt: 'receipt_001.pdf',
        subGrowersFile: 'subgrowers_001.xlsx',
        createdAt: '2024-09-20',
        status: 'Pending'
      },
      {
        id: '2',
        companyName: 'Sunrise Agriculture Co',
        companyAddress: '456 Harvest Road, Crop Town, CT 67890',
        companyTelephone: '+256-987-654-321',
        amountEnclosed: '75000',
        registeredSeedMerchant: 'Seed Masters Ltd',
        paymentReceipt: 'receipt_002.pdf',
        subGrowersFile: 'subgrowers_002.xlsx',
        createdAt: '2024-09-18',
        status: 'Approved'
      }
    ]);
  }, []);

  const handleAddApplication = () => {
    setEditingApplication(null);
    setResetForm(true);
    setIsDialogOpen(true);
    setTimeout(() => setResetForm(false), 0);
  };

  const handleEditApplication = (application: PlantingReturns) => {
    setEditingApplication(application);
    setIsDialogOpen(true);
  };

  const handleViewApplication = (application: PlantingReturns) => {
    setEditingApplication(application);
    setIsDetailOpen(true);
  };

  const handleDeleteApplication = async (application: PlantingReturns) => {
    if (!window.confirm(`Delete application from "${application.companyName}"?`)) return;
    
    try {
      setDeletingApplicationId(String(application.id));
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApplications(apps => apps.filter(app => app.id !== application.id));
      toast('Application deleted successfully');
    } catch (error) {
      toast('Failed to delete application');
    } finally {
      setDeletingApplicationId(null);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingApplication) {
        // Update existing application
        const updatedApplication = { ...editingApplication, ...data };
        setApplications(prev => prev.map(app => 
          app.id === editingApplication.id ? updatedApplication : app
        ));
        toast('Application updated successfully');
      } else {
        // Create new application
        const newApplication: PlantingReturns = {
          id: Date.now().toString(),
          companyName: data.companyName,
          companyAddress: data.companyAddress,
          companyTelephone: data.companyTelephone,
          amountEnclosed: data.amountEnclosed,
          registeredSeedMerchant: data.registeredSeedMerchant,
          paymentReceipt: data.paymentReceipt,
          subGrowersFile: data.subGrowersFile,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'Pending'
        };
        setApplications(prev => [...prev, newApplication]);
        toast('Application created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingApplication(null);
    } catch (error) {
      toast('Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setEditingApplication(null);
    }
  };
  const handleDetailsClose = (open: boolean) => {
    if (!open) {
      setIsDetailOpen(false);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Planting Returns</h1>
            <p className="text-gray-600">Manage planting return applications and approvals</p>
          </div>
          <PlantingReturnsListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Planting Returns</h1>
          <p className="text-gray-600">Manage planting return applications and approvals</p>
        </div>
        
        <PlantingReturnsList
          applications={applications}
          onAddApplication={handleAddApplication}
          onEditApplication={handleEditApplication}
          onDeleteApplication={handleDeleteApplication}
          onViewApplication={handleViewApplication}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          deletingApplicationId={deletingApplicationId}
        />

        <PlantingReturnsForm
          isOpen={isDialogOpen}
          onClose={handleClose}
          onSubmit={handleSubmit}
          loading={loading}
          resetForm={resetForm}
          initialValues={editingApplication}
          title={editingApplication ? 'Edit Application' : 'Create New Application'}
          submitLabel={editingApplication ? 'Update Application' : 'Create Application'}
        />

        <PlantingReturnDetails
          application={editingApplication!}
          open={isDetailsOpen}
          onClose={handleDetailsClose}
          
        />
      </div>
    </div>
  );
};

export { PlantingReturnsListPage };
export default PlantingReturnsListPage;