import { useQuery } from "@apollo/client/react";
import { ME } from "@/gql/queries";
import { ChangePasswordCard } from "./blocks";

const AccountOverviewContent = () => {
  const { data } = useQuery(ME);
  const me = data?.me;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="xl:col-span-2 flex flex-col gap-5 lg:gap-7.5">
        <ChangePasswordCard />
      </div>
      <div className="xl:col-span-1 flex flex-col gap-5 lg:gap-7.5">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Security Tips</h3>
          </div>
          <div className="card-body">
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2">
              <li>Use at least 8 characters with letters and numbers.</li>
              <li>Avoid reusing old passwords or sharing them.</li>
              <li>Update your password after any suspicious activity.</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Signed-in Account</h3>
          </div>
          <div className="card-body text-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Username</span>
              <span className="font-medium text-gray-900">
                {me?.username || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">
                {me?.email || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium text-gray-900">
                {me?.phone_number || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AccountOverviewContent };
