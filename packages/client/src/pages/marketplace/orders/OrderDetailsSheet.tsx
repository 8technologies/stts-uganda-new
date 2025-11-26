import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { KeenIcon } from '@/components';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: any;
}

const OrderDetailsSheet: React.FC<Props> = ({ open, onOpenChange, order }) => {
  const o = order || {};

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'cancelled':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[500px] h-full flex flex-col p-0 bg-white">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Order Details</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Order ID & Status */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Order ID</div>
            <div className="text-2xl font-bold">#{o.id}</div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(o.status)}`}>
                {o.status || 'Pending'}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-600">Order Date</div>
              <div className="text-sm font-medium">{formatDate(o.created_at)}</div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">Buyer</div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-600">Name</span>
                <div className="text-sm font-medium">{o.Buyer?.name || o.Buyer?.username || '-'}</div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Username</span>
                <div className="text-sm font-medium">{o.Buyer?.username || '-'}</div>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">Seller</div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-600">Name</span>
                <div className="text-sm font-medium">{o.Seller?.name || o.Seller?.username || '-'}</div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Username</span>
                <div className="text-sm font-medium">{o.Seller?.username || '-'}</div>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">Quantity</div>
            <div className="text-lg font-bold">{o.quantity ?? '-'} kg</div>
          </div>

          {/* Comment */}
          {o.comment && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Comment</div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">{o.comment}</div>
            </div>
          )}

          {/* Product Info (if available from nested query) */}
          {o.product_id && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Product</div>
              <div className="text-sm text-gray-700">Product ID: {o.product_id}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex gap-2">
          <button className="flex-1 btn btn-ghost" onClick={() => onOpenChange(false)}>
            Close
          </button>
          {/* Add action buttons here if needed (e.g., Cancel Order, Contact Seller) */}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsSheet;