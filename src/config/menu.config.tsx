import { type TMenuConfig } from '@/components/menu';

// Sidebar menu customized for STTS
export const MENU_SIDEBAR: TMenuConfig = [
  { title: 'Dashboard', icon: 'element-11', path: '/' },
  { title: 'Track and trace', icon: 'magnifier', path: '/track-trace' },
  {
    title: 'Application Forms',
    icon: 'document',
    children: [
      { title: 'SR4 - Stockist/Company', path: '/apps/sr4' },
      { title: 'SR6 - Grower/Producer', path: '/apps/sr6' },
      { title: 'QDS - Producer', path: '/apps/qds' }
    ]
  },
  {
    title: 'Quality Assurance',
    icon: 'folder-added',
    children: [
      { title: 'Field inspections', path: '/qa/inspections' },
      { title: 'Lab tests', path: '/qa/labs' },
      { title: 'Certificates', path: '/qa/certificates' }
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
      { title: 'Users & Roles', path: '/admin/users' },
      { title: 'Settings', path: '/admin/settings' }
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
