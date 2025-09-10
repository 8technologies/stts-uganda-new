import { type TMenuConfig } from '@/components/menu';
import { MODULES_CONFIG } from '@/pages/roles/permissions.config';

// Helper: find permission id by module + permission id
const byModuleId = Object.fromEntries(MODULES_CONFIG.map((m) => [m.id, m]));
const getPerm = (moduleId: string, permissionId: string) => {
  const m = byModuleId[moduleId];
  const p = m?.permissions.find((x) => x.id === permissionId);
  return p?.id ?? permissionId; // fallback to key
};

// Sidebar menu customized for STTS
// You can optionally add `requiredPermissions?: string[]` to control visibility
export const MENU_SIDEBAR: TMenuConfig = [
  { title: 'Dashboard', icon: 'element-11', path: '/' },
  {
    title: 'Track and trace',
    icon: 'magnifier',
    path: '/track-trace',
    requiredPermissions: [getPerm('track_and_trace', 'can_view_tracking')]
  },
  {
    title: 'Application Forms',
    icon: 'document',
    children: [
      {
        title: 'SR4 - Stockist/Company',
        path: '/apps/sr4',
        requiredPermissions: [getPerm('application_forms', 'can_view_sr4_forms')]
      },
      {
        title: 'SR6 - Grower/Producer',
        path: '/apps/sr6',
        requiredPermissions: [getPerm('application_forms', 'can_view_sr6_forms')]
      },
      {
        title: 'QDS - Producer',
        path: '/apps/qds',
        requiredPermissions: [getPerm('application_forms', 'can_view_qds_forms')]
      }
    ]
  },
  {
    title: 'Quality Assurance',
    icon: 'folder-added',
    children: [
      {
        title: 'Field inspections',
        path: '/qa/inspections',
        requiredPermissions: [getPerm('quality_assurance', 'can_view_field_inspections')]
      },
      {
        title: 'Lab tests',
        path: '/qa/labs',
        requiredPermissions: [getPerm('quality_assurance', 'can_manage_all_qa_tasks')]
      },
      {
        title: 'Certificates',
        path: '/qa/certificates',
        requiredPermissions: [getPerm('quality_assurance', 'can_manage_all_qa_tasks')]
      }
    ]
  },
  {
    title: 'Seed stock',
    icon: 'questionnaire-tablet',
    children: [
      { title: 'Stock records', path: '/stock/records' },
      { title: 'Stock examination', path: '/stock/examination' },
      { title: 'Marketable seed', path: '/stock/marketable' }
    ]
  },
  {
    title: 'Market place',
    icon: 'purchase',
    children: [
      { title: 'Products', path: '/market/products' },
      { title: 'Orders', path: '/market/orders' },
      { title: 'Quotations', path: '/market/quotations' }
    ]
  },
  {
    title: 'System Configuration',
    icon: 'setting-2',
    children: [
      {
        title: 'Users',
        path: '/admin/users',
        requiredPermissions: [getPerm('system_configuration', 'can_manage_users')]
      },
      {
        title: 'Roles',
        path: '/admin/roles',
        requiredPermissions: [getPerm('system_configuration', 'can_manage_roles')]
      },
      {
        title: 'Settings',
        path: '/admin/settings',
        requiredPermissions: [getPerm('system_configuration', 'can_view_settings')]
      }
    ]
  },
  {
    title: 'My Profile',
    icon: 'profile-circle',
    children: [
      { title: 'Overview', path: '/account/home/user-profile' },
      { title: 'Security', path: '/account/security/overview' }
    ]
  }
];

// Minimal root menu for other demo layouts that rely on it
export const MENU_ROOT: TMenuConfig = [
  { title: 'STTS', icon: 'element-11', rootPath: '/', path: '/', childrenIndex: 0 },
  {
    title: 'Account',
    icon: 'setting-2',
    rootPath: '/account/',
    path: '/account/home/user-profile',
    childrenIndex: 0
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    rootPath: '/auth/',
    path: '/auth/login',
    childrenIndex: 0
  }
];

// Minimal root menu for other demo layouts that rely on it
export const MENU_MEGA: TMenuConfig = [
  // { title: 'STTS', icon: 'element-11', rootPath: '/', path: '/', childrenIndex: 0 },
  // { title: 'Account', icon: 'setting-2', rootPath: '/account/', path: '/account/home/user-profile', childrenIndex: 0 },
  // { title: 'Authentication', icon: 'security-user', rootPath: '/auth/', path: '/auth/login', childrenIndex: 0 }
];
