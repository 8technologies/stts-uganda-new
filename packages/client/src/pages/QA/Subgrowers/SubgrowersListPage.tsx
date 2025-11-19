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
import { SubgrowersForm } from './components/SubgrowersForm';
import { SubgrowerDetails } from './components/SubgrowerDetails';

type Subgrowers = {
  id: string | number;
  responsiblePerson: string;
  fieldName: string;
  phoneNumber: string;
  gardenSize: string;
  crop: string;
  cropVariety: string;
  seedClass: string;
  motherlotNumber: string;
  foundationSeedSource: string;
  district: string;
  subcounty?: string;
  village: string;
  plantingDate?: string;
  quantity?: string;
  expectedYield?: string;
  latitude?: string;
  longitude?: string;
  details?: string;
  createdAt: string;
  plantingReturnId?: string | number;
  plantingReturn:{
    id: string | number;
    companyName: string;
  }
  status: 'Pending' | 'Approved' | 'Rejected';
};

// Application List Component
const SubgrowersList = ({
  applications,
  onAddApplication,
  onEditApplication,
  onDeleteApplication,
  onViewApplication,
  searchTerm,
  onSearchChange,
  deletingApplicationId
}: {
  applications: Subgrowers[];
  onAddApplication: () => void;
  onEditApplication: (app: Subgrowers) => void;
  onDeleteApplication: (app: Subgrowers) => void;
  onViewApplication: (app: Subgrowers) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  deletingApplicationId: string | null;
}) => {
  const filteredApplications = applications.filter(app =>
    app.plantingReturn.companyName.toLowerCase().includes(searchTerm.toLowerCase()) 
    // app.registeredSeedMerchant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Subgrowers</h2>
          {/* <Button onClick={onAddApplication} size="sm">
            <Plus size={16} className="mr-2" />
            New Application
          </Button> */}
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search subgrowers..."
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
                Field Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Person responsible
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                District
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Crop
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variety
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seed class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inspector
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
                    <div className="text-sm font-medium text-gray-900">{application.plantingReturn.companyName}</div>
                    {/* <div className="text-sm text-gray-500">{application.companyTelephone}</div> */}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  UGX {parseInt(application.fieldName).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{application.responsiblePerson}</div>
                    <div className="text-sm text-gray-500">{application.phoneNumber}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {application.district}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {application.crop}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {application.cropVariety}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {application.seedClass}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {application.inspector || 'N/A'}
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
const SubgrowersListSkeleton = () => (
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
const SubgrowersListPage = () => {
  const [applications, setApplications] = useState<Subgrowers[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingApplicationId, setDeletingApplicationId] = useState<string | null>(null);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailOpen] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Subgrowers | null>(null);

  // Sample data
  useEffect(() => {
    setApplications([
      {
        id: '1',
        responsiblePerson: 'John Doe',
        fieldName: 'Field A',
        phoneNumber: '+256-700-123-456',
        gardenSize: '2 acres',
        crop: 'Maize',
        cropVariety: 'Hybrid',
        seedClass: 'Foundation',
        motherlotNumber: 'ML123',
        foundationSeedSource: 'AgriCorp Ltd',
        district: 'Kampala',
        subcounty: 'Nakawa',
        village: 'Buziga',
        plantingDate: '2024-03-01',
        quantity: '200kg',
        expectedYield: '1000kg',
        latitude: '0.3191',
        longitude: '32.5692',
        details: 'Good condition',
        createdAt: '2024-01-01',
        plantingReturnId: '101',
        plantingReturn: {
          id: '101',
          companyName: 'Green Valley Seeds Ltd',
        },
        status: 'Pending',
      },
      {
        id: '2',
        responsiblePerson: 'Jane Smith',
        fieldName: 'Field B',
        phoneNumber: '+256-700-987-654',
        gardenSize: '3 acres',
        crop: 'Coffee',
        cropVariety: 'Arabica',
        seedClass: 'Certified',
        motherlotNumber: 'ML124',
        foundationSeedSource: 'SeedCo',
        district: 'Mbarara',
        subcounty: 'Nyamitanga',
        village: 'Kabuyanda',
        plantingDate: '2024-02-15',
        quantity: '300kg',
        expectedYield: '1500kg',
        latitude: '0.6047',
        longitude: '30.6772',
        details: 'Good condition',
        createdAt: '2024-01-15',
        plantingReturnId: '102',
        plantingReturn: {
          id: '102',
          companyName: 'Sunrise Agriculture',
        },
        status: 'Approved',
      },
      {
        id: '3',
        responsiblePerson: 'Samuel K',
        fieldName: 'Field C',
        phoneNumber: '+256-700-321-765',
        gardenSize: '1.5 acres',
        crop: 'Beans',
        cropVariety: 'Red Kidney',
        seedClass: 'Certified',
        motherlotNumber: 'ML125',
        foundationSeedSource: 'AgroSeed Ltd',
        district: 'Gulu',
        subcounty: 'Bardege',
        village: 'Palaro',
        plantingDate: '2024-04-10',
        quantity: '150kg',
        expectedYield: '700kg',
        latitude: '2.7766',
        longitude: '32.3053',
        details: 'Normal growth',
        createdAt: '2024-02-05',
        plantingReturnId: '103',
        plantingReturn: {
          id: '103',
          companyName: 'AgroSeeds Uganda',
        },
        status: 'Rejected',
      },
    ]);
  }, []);

  const handleAddApplication = () => {
    setEditingApplication(null);
    setResetForm(true);
    setIsDialogOpen(true);
    setTimeout(() => setResetForm(false), 0);
  };

  const handleEditApplication = (application: Subgrowers) => {
    setEditingApplication(application);
    setIsDialogOpen(true);
  };

  const handleViewApplication = (application: Subgrowers) => {
    setEditingApplication(application);
    setIsDetailOpen(true);
  };

  const handleDeleteApplication = async (application: Subgrowers) => {
    if (!window.confirm(`Delete application from "${application.plantingReturn.companyName}"?`)) return;
    
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
        const newApplication: Subgrowers = {
          id: Date.now().toString(),
          responsiblePerson: data.responsiblePerson, // Add this field
          fieldName: data.fieldName, // Add this field
          phoneNumber: data.phoneNumber, // Add this field
          gardenSize: data.gardenSize, // Add this field
          crop: data.crop, // Add this field
          cropVariety: data.cropVariety, // Add this field
          seedClass: data.seedClass, // Add this field
          motherlotNumber: data.motherlotNumber, // Add this field
          foundationSeedSource: data.foundationSeedSource, // Add this field
          district: data.district, // Add this field
          subcounty: data.subcounty, // Add this field (optional)
          village: data.village, // Add this field
          plantingDate: data.plantingDate, // Add this field (optional)
          quantity: data.quantity, // Add this field (optional)
          expectedYield: data.expectedYield, // Add this field (optional)
          latitude: data.latitude, // Add this field (optional)
          longitude: data.longitude, // Add this field (optional)
          details: data.details, // Add this field (optional)
          createdAt: new Date().toISOString().split('T')[0],
          plantingReturnId: data.plantingReturnId, // Add this field (optional)
          plantingReturn: {
            id: data.plantingReturn.id, // Add this field
            companyName: data.plantingReturn.companyName, // Add this field
          },
          status: 'Pending', // default value
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
            <h1 className="text-2xl font-bold text-gray-900">Subgrowers</h1>
            <p className="text-gray-600">Manage subgrower fields</p>
          </div>
          <SubgrowersListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
           <h1 className="text-2xl font-bold text-gray-900">Subgrowers</h1>
            <p className="text-gray-600">Manage subgrower fields</p>
        </div>
        
        <SubgrowersList
          applications={applications}
          onAddApplication={handleAddApplication}
          onEditApplication={handleEditApplication}
          onDeleteApplication={handleDeleteApplication}
          onViewApplication={handleViewApplication}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          deletingApplicationId={deletingApplicationId}
        />

        <SubgrowersForm
          isOpen={isDialogOpen}
          onClose={handleClose}
          onSubmit={handleSubmit}
          loading={loading}
          resetForm={resetForm}
          initialValues={editingApplication}
          title={editingApplication ? 'Edit Application' : 'Create New Application'}
          submitLabel={editingApplication ? 'Update Application' : 'Create Application'}
        />

        <SubgrowerDetails
          application={editingApplication!}
          open={isDetailsOpen}
          onClose={handleDetailsClose}
          
        />
      </div>
    </div>
  );
};

export { SubgrowersListPage };
export default SubgrowersListPage;