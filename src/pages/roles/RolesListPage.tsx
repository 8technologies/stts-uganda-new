import React, { useEffect, useState } from 'react';
import { Plus, Users, Settings, Shield } from 'lucide-react';
import { ModulesPermissions } from './ModulesPermissions';
import AddRoleDialog from './blocks/AddRoleDialog';
import AddModuleDialog from './blocks/AddModuleDialog';
import { useMutation, useQuery } from '@apollo/client/react';
import { ROLES } from '@/gql/queries';
import { ADDROLE, LOGIN } from '@/gql/mutations';
import { useLocation, useNavigate } from 'react-router';
import { AuthModel, useAuthContext } from '@/auth';
import * as authHelper from '../../auth/_helpers';
import { getData } from '@/utils';


const mockModules = {
  1: [ // Admin modules
    {
      id: 1,
      name: 'User Management',
      icon: Users,
      permissions: ['Create Users', 'Edit Users', 'Delete Users', 'View Users']
    },
    {
      id: 2,
      name: 'System Configuration',
      icon: Settings,
      permissions: ['View Settings', 'Edit Settings', 'Manage Integrations', 'System Logs']
    },
    {
      id: 3,
      name: 'Security',
      icon: Shield,
      permissions: ['Manage Roles', 'Audit Logs', 'Security Settings', 'Access Control']
    }
  ],
  2: [ // Designer modules
    {
      id: 1,
      name: 'User Management',
      icon: Users,
      permissions: ['View Users']
    }
  ],
  3: [ // Engineer modules
    {
      id: 1,
      name: 'User Management',
      icon: Users,
      permissions: ['Create Users', 'Edit Users', 'View Users']
    },
    {
      id: 2,
      name: 'System Configuration',
      icon: Settings,
      permissions: ['View Settings', 'Edit Settings']
    }
  ],
  4: [ // Viewer modules
    {
      id: 1,
      name: 'User Management',
      icon: Users,
      permissions: ['View Users']
    }
  ],
  5: [ // Analyst modules
    {
      id: 1,
      name: 'User Management',
      icon: Users,
      permissions: ['View Users']
    },
    {
      id: 2,
      name: 'System Configuration',
      icon: Settings,
      permissions: ['View Settings']
    }
  ]
};

const RolesList = ({ roles, selectedRole, onRoleSelect, onAddRole }/* : IRolesListProps */) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
        <button
          onClick={onAddRole}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Role
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-2">
          {roles?.map((role) => (
            <div
              key={role.id}
              onClick={() => onRoleSelect(role)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedRole?.id === role.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                </div>
                {/* <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{role.userCount}</span>
                  <p className="text-xs text-gray-500">users</p>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Roles Component
const RolesListPage = () => {
//   const [roles, setRoles] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const { loading, error, data } = useQuery(ROLES);
  
  const auth = authHelper.getAuth(); // retrieves from localStorage/sessionStorage
    const token = auth?.access_token;
    
  const from = location.state?.from?.pathname || '/';
  const [addRole, { error:err, loading: addingRole }] = useMutation(ADDROLE);
  

  const roles = data?.all_roles || [];
  console.log('data', data);

  if (loading) return <div>Loading roles...</div>;
if (error){ 
    console.log(error);
    return <div>Error loading roles</div>};


  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleAddRole = () => {
    setIsAddRoleDialogOpen(true);
    // alert('Add Role functionality would be implemented here');
  };

  const handleAddModule = () => {
    alert('Add Module functionality would be implemented here');
  };


const handleAddRoleSubmit = async (roleData) => {
  try {
    const res = await addRole({
      variables: {
        payload: {
              role_name: roleData.name,
              description: roleData.description,
            }
      },
    });

    // Log the response from the mutation
    console.log('Role added successfully:', res);
    
    // Optionally, you can handle the successful response here, like refreshing the list or closing the dialog
    setIsAddRoleDialogOpen(false);

  }catch {
    console.error('Error adding role:');

    // Handle error case
    setIsAddRoleDialogOpen(false);
  }
};

  const selectedRoleModules = selectedRole ? mockModules[selectedRole.id] || [] : [];
//   const selectedRoleModules = selectedRole ? selectedRole.permissions || [] : [];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-600 mt-1">Manage system roles and their permissions</p>
        </div>
        

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          <RolesList
            roles={roles}
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            onAddRole={handleAddRole}
          />
          
          <ModulesPermissions
            selectedRole={selectedRole}
            modules={selectedRoleModules}
            onAddModule={handleAddModule}
          />
        </div>
      </div>
      <AddRoleDialog
        isOpen={isAddRoleDialogOpen}
        onClose={() => setIsAddRoleDialogOpen(false)}
        onSubmit={handleAddRoleSubmit}
      />

      <AddModuleDialog
        isOpen={isAddRoleDialogOpen}
        onClose={() => setIsAddRoleDialogOpen(false)}
        onSubmit={handleAddRoleSubmit}
      />
    </div>
  );
};

export  {RolesListPage};