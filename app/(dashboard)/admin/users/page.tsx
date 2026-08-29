import { USER_ROLES } from '@/constants/roles.const';

import { requireAdminArea } from '@/lib/auth';
import { UserService } from '@/lib/services';
import { resolveRoleLabel } from '@/lib/utils';

import { setAccountActiveAction } from '@/components/admin/actions';

const userService = new UserService();

export default async function AdminUsersPage() {
  await requireAdminArea();

  const result = await userService.list();
  const users = result.result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h1>Users</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.userId} className="border-border border-b">
                <td className="py-2 pr-4 font-medium">{user.name}</td>
                <td className="text-muted-foreground py-2 pr-4">{user.email}</td>
                <td className="py-2 pr-4">{resolveRoleLabel(user.role)}</td>
                <td className="py-2 pr-4">{user.isActive ? 'Active' : 'Deactivated'}</td>
                <td className="py-2">
                  {user.role !== USER_ROLES.SUPER_ADMIN && (
                    <form action={setAccountActiveAction}>
                      <input type="hidden" name="userId" value={user.userId} />
                      <input type="hidden" name="isActive" value={user.isActive ? 'false' : 'true'} />
                      <button type="submit" className="border-border hover:bg-muted rounded-md border px-2 py-1 text-xs font-medium">
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
