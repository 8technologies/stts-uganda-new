/**
 * Permission Checker
 * @param userPermissions - The user's permissions object.
 * @param permissionKey - The key of the permission to check.
 * @returns Whether the user is eligible (true) or not (false).
 */
const hasPermission = (
  userPermissions: Record<string, boolean> | null | undefined,
  permissionKey: string
): boolean => {
  if (!userPermissions || typeof userPermissions !== 'object') {
    console.error('Invalid user permissions object.');
    return false;
  }

  return Boolean(userPermissions[permissionKey]);
};

export default hasPermission;
