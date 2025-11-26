import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { useMutation, useQuery } from "@apollo/client/react";
import { Sheet } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { LOAD_SEED_LABELS } from "@/gql/queries";
import { CREATE_SEED_LABEL, DELETE_SEED_LABEL } from "@/gql/mutations";
import SeedLabelForm from "./SeedLabelForm";
import SeedLabelDetailSheet from './SeedLabelDetails';
import { toast } from "sonner";
import { KeenIcon } from '@/components';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Package,
  Printer
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";

const SeedLabelManagementPage = () => {

  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canManageSeedLabels = !!perms['can_manage_seed_labels'];
  const canPrintLabels = !!perms['can_print_seed_labels'];
  const canDeleteLabels = !!perms['can_edit_seed_labels'];

  const userEditPermissions = canDeleteLabels;
  
  const { data, loading, error } = useQuery(LOAD_SEED_LABELS, {
    fetchPolicy: "cache-and-network",
  });
  
  const [createSeedLabel, { loading: saving }] = useMutation(CREATE_SEED_LABEL, {
    refetchQueries: [{ query: LOAD_SEED_LABELS }],
    awaitRefetchQueries: true
  });
  const [deleteSeedLabel] = useMutation(DELETE_SEED_LABEL, {
    refetchQueries: [{ query: LOAD_SEED_LABELS }],
    awaitRefetchQueries: true
  });
  
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedSeedLabel, setSelectedSeedLabel] = useState<any>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = () => {
    setIsCreateSheetOpen(true);
  };

  const handleSubmit = async (vals: Record<string, any>) => {
    const input = {
      id: null,
      applicant_remark: vals.remarks ?? null,
      receipt: vals.receipt ?? null,
      seed_lab_id: vals.labTestNumber ?? null,
      seed_label_package: vals.seedLabelPackage ?? null,
      quantity: vals.quantity ?? null,
      available_stock: vals.available_stock ?? null,
      image: vals.thumbnailImage ?? null,
    };

    try {
      await createSeedLabel({ variables: { input } });
      toast.success('Seed label created successfully');
      setIsCreateSheetOpen(false);
    } catch (e: any) {
      toast.error('Failed to create seed label', { description: e?.message ?? 'Unknown error' });
    }
  };

  const handleEdit = (id: string) => {
    const seedLabelToEdit = data.getSeedLabels?.find((label: any) => label.id === id);
    setSelectedSeedLabel(seedLabelToEdit);
    setIsEditSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this seed label?')) {
      try {
        await deleteSeedLabel({ variables: { id } });
        toast.success('Seed label deleted successfully');
      } catch (e: any) {
        toast.error('Failed to delete seed label', { description: e?.message ?? 'Unknown error' });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any; bg: string; text: string; label: string }> = {
      approved: {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Approved"
      },
      pending: {
        icon: <Clock className="w-3.5 h-3.5" />,
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Pending"
      },
      rejected: {
        icon: <XCircle className="w-3.5 h-3.5" />,
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Rejected"
      },
      printed: {
        icon: <Printer className="w-3.5 h-3.5" />,
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Printed"
      }
    };

    const config = configs[status?.toLowerCase()] || {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: status || "Unknown"
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const filteredLabels = data?.getSeedLabels?.filter((label: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      label.id?.toLowerCase().includes(query) ||
      label.label_number?.toLowerCase().includes(query) ||
      label.createdBy?.username?.toLowerCase().includes(query) ||
      label.status?.toLowerCase().includes(query)
    );
  }) || [];

  const stats = {
    total: data?.getSeedLabels?.length || 0,
    approved: data?.getSeedLabels?.filter((l: any) => l.status?.toLowerCase() === 'approved')?.length || 0,
    pending: data?.getSeedLabels?.filter((l: any) => l.status?.toLowerCase() === 'pending')?.length || 0,
    rejected: data?.getSeedLabels?.filter((l: any) => l.status?.toLowerCase() === 'rejected')?.length || 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seed Labels</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and track all seed certification labels
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button> */}
              { !canManageSeedLabels && (
                <Button 
                  onClick={handleCreate} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                <Plus className="w-4 h-4 mr-2" />
                  Create Label
                </Button>
              )}
              
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Labels</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold text-gray-900">All Seed Labels</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search labels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64 h-9 border-gray-300"
                  />
                </div>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Crop
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Variety
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="mt-3 text-sm text-gray-600">Loading seed labels...</p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                          <p className="text-sm font-medium text-gray-900">Error loading data</p>
                          <p className="text-sm text-gray-600 mt-1">{error.message}</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLabels.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm font-medium text-gray-900">No seed labels found</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {searchQuery ? "Try adjusting your search" : "Get started by creating a new label"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLabels.map((label: any) => (
                      <tr 
                        key={label.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setDetailsItem(label)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {label.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {label.Crop?.name || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {label.CropVariety?.name || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-emerald-700">
                                {label.createdBy?.username?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {label.createdBy?.username || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(label.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem
                                onClick={() => setDetailsItem(label)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4 text-gray-600" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              {canDeleteLabels && label.status ==='pending' && (
                                <>
                                {console.log('userEditPermissions', label.status ==='pending')}
                                <DropdownMenuItem
                                onClick={() => handleEdit(label.id)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4 text-gray-600" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(label.id)}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                                </>
                              )}
                              
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Seed Label Sheet */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SeedLabelForm
          open={isCreateSheetOpen}
          onOpenChange={setIsCreateSheetOpen}
          onSave={handleSubmit}
        />
      </Sheet>

      {/* Edit Seed Label Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SeedLabelForm
          open={isEditSheetOpen}
          onOpenChange={setIsEditSheetOpen}
          initialData={selectedSeedLabel}
          onSave={(formData) => {
            handleSubmit(formData);
            setIsEditSheetOpen(false);
          }}
        />
      </Sheet>

      {/* Details Sheet */}
      {detailsItem && (
        <SeedLabelDetailSheet 
          open={!!detailsItem}
          onOpenChange={() => setDetailsItem(null)}
          data={detailsItem}
        />
      )}
    </div>
  );
};

export default SeedLabelManagementPage;