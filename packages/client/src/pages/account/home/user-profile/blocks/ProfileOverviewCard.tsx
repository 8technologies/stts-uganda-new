import { useQuery } from "@apollo/client/react";
import { ME } from "@/gql/queries";

const ProfileOverviewCard = () => {
  const { data, loading, error } = useQuery(ME);
  const me = data?.me;

  const accountTypes = [
    me?.is_grower ? "Grower" : null,
    me?.is_merchant ? "Merchant" : null,
    me?.is_qds_producer ? "QDS Producer" : null,
  ].filter(Boolean);

  const accountTypeLabel =
    accountTypes.length > 0 ? accountTypes.join(", ") : "Standard";

  const memberSince = me?.created_at
    ? new Date(me.created_at).toLocaleDateString("en-GB")
    : "N/A";

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Overview</h3>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-sm text-gray-600">Loading profile…</div>
        ) : error ? (
          <div className="text-sm text-danger">Failed to load profile.</div>
        ) : (
          <div className="space-y-3 text-sm">
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
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium text-gray-900">
                {me?.phone_number || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">District</span>
              <span className="font-medium text-gray-900">
                {me?.district || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Premises</span>
              <span className="font-medium text-gray-900">
                {me?.premises_location || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Account Type</span>
              <span className="font-medium text-gray-900">
                {accountTypeLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium text-gray-900">{memberSince}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ProfileOverviewCard };
