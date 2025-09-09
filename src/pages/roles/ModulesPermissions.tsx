import { Plus, Users, Settings, Shield  } from "lucide-react";
import { useState } from "react";

const ModulesPermissions = ({ selectedRole, modules, onAddModule }) => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [permissions, setPermissions] = useState({});

  const handlePermissionChange = (moduleId, permission) => {
    setPermissions(prev => ({
      ...prev,
      [`${moduleId}-${permission}`]: !prev[`${moduleId}-${permission}`]
    }));
  };

  if (!selectedRole) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Role</h3>
            <p className="text-gray-500">Choose a role to view its modules and permissions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedRole.name} - Modules & Permissions
        </h2>
        <button
          onClick={onAddModule}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Module
        </button>
      </div>
      <div className="p-6">
        {modules && modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const isSelected = selectedModule?.id === module.id;
              
              return (
                <div key={module.id} className="border border-gray-200 rounded-lg">
                  <div
                    onClick={() => setSelectedModule(isSelected ? null : module)}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="text-gray-600" />
                      <span className="font-medium text-gray-900">{module.name}</span>
                    </div>
                    <div className={`transform transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
                        <div className="space-y-2">
                          {module.permissions.map((permission) => {
                            const permissionKey = `${module.id}-${permission}`;
                            
                            return (
                              <label key={permission} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`module-${module.id}`}
                                  checked={permissions[permissionKey] || false}
                                  onChange={() => handlePermissionChange(module.id, permission)}
                                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">{permission}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Modules Assigned</h3>
            <p className="text-gray-500">This role doesn't have any modules assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export {ModulesPermissions}