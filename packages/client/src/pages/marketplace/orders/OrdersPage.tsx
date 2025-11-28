import React, { useEffect, useMemo, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { ME, ORDERS } from '@/gql/queries';
import { KeenIcon } from '@/components';
import OrderDetailsSheet from './OrderDetailsSheet';
import { useAuthContext, UserModel } from '@/auth';

const OrdersPage: React.FC = () => {
  const { auth } = useAuthContext();
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();

  const [loadMe, { data:userData, loading:userLoading, error:userError }] = useLazyQuery(ME, {
    fetchPolicy: 'network-only',
  });

  // Run the lazy query AFTER component renders
  useEffect(() => {
    loadMe();   // ✔️ allowed
  }, []);

  // When data arrives, update state
  useEffect(() => {
    if (userData?.me) {
      setCurrentUser(userData.me);
      console.log("Loaded user:", userData.me);
    }
  }, [userData]);


  const currentUserId = currentUser?.id;

  const { data, loading, error, refetch } = useQuery(ORDERS, {
    fetchPolicy: 'cache-and-network',
  });

  const orders: any[] = data?.getOrders ?? [];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [orderType, setOrderType] = useState<'made' | 'received'>('made'); // 'made' = orders I made, 'received' = orders made to me
  const [detailsOrder, setDetailsOrder] = useState<any | null>(null);

  const filtered = useMemo(() => {
    let result = orders;

    // Separate orders: "made" (I am buyer) vs "received" (I am seller)
    if (orderType === 'made') {
      result = result.filter((o) => String(o.buyer_id) === String(currentUserId));
    } else if (orderType === 'received') {
      result = result.filter((o) => String(o.seller_id) === String(currentUserId));
    }

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) =>
        String(o.Buyer?.name ?? o.Buyer?.username ?? '').toLowerCase().includes(q) ||
        String(o.Seller?.name ?? o.Seller?.username ?? '').toLowerCase().includes(q) ||
        String(o.comment ?? '').toLowerCase().includes(q)
      );
    }

    // Filter by status if not 'all'
    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus);
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, filterStatus, orderType, currentUserId]);

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-600">Manage your marketplace orders</p>
      </div>

      {/* Order Type Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            orderType === 'made'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setOrderType('made')}
        >
          <KeenIcon icon="shopping-cart" className="inline mr-2" />
          Orders I Made
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            orderType === 'received'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setOrderType('received')}
        >
          <KeenIcon icon="box" className="inline mr-2" />
          Orders Received
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <KeenIcon icon="magnifier" />
            </span>
            <input
              className="w-full pl-10 pr-3 py-2 rounded-lg border bg-white text-sm"
              placeholder={orderType === 'made' ? 'Search by seller or comment…' : 'Search by buyer or comment…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            className="px-3 py-2 rounded-lg border bg-white text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
            <KeenIcon icon="refresh" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
        {loading && (
          <div className="p-6 text-center text-gray-600">
            <KeenIcon icon="loader" /> Loading orders…
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-600">
            Failed to load orders. {error.message}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-600">
            {orderType === 'made' ? 'No orders made yet.' : 'No orders received yet.'}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Order ID</th>
                  {orderType === 'made' && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Seller</th>
                  )}
                  {orderType === 'received' && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Buyer</th>
                  )}
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Quantity</th>
                  {/* <th className="text-left px-4 py-3 font-semibold text-gray-700">Comment</th> */}
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                    {orderType === 'made' && (
                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">{order.Seller?.name || order.Seller?.username || '-'}</div>
                      </td>
                    )}
                    {orderType === 'received' && (
                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">{order.Buyer?.name || order.Buyer?.username || '-'}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-700">{order.quantity ?? '-'} kg</td>
                    
                    
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.created_at)}</td>
                    
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setDetailsOrder(order)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">{filtered.length}</span> order(s) displayed
          </div>
        </div>
      )}

      {/* Order Details Sheet */}
      {detailsOrder && (
        <OrderDetailsSheet
          open={!!detailsOrder}
          onOpenChange={() => setDetailsOrder(null)}
          order={detailsOrder}
          orderType={orderType}
        />
      )}
    </div>
  );
};

export default OrdersPage;