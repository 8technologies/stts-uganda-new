import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  User, 
  Calendar, 
  MessageSquare, 
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Hash,
  Weight,
  Building2,
  Mail,
  Phone,
  Loader2Icon,
  Loader
} from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client/react';
import { ORDERS } from '@/gql/queries';
import { PROCESS_ORDER } from '@/gql/mutations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: any;
  orderType?: 'made' | 'received';
}

const OrderDetailsSheet: React.FC<Props> = ({ open, onOpenChange, order, orderType = 'made' }) => {
  const o = order || {};
  const { data, loading, error, refetch } = useQuery(ORDERS);
  const [updateOrder, { loading: savingOrder }] = useMutation(PROCESS_ORDER, {
    refetchQueries: [{ query: ORDERS }],
    awaitRefetchQueries: true
 });

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

  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          label: 'Delivered',
          borderColor: 'border-emerald-200'
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          label: 'Pending',
          borderColor: 'border-amber-200'
        };
      case 'canceled':
        return {
          icon: <XCircle className="w-4 h-4" />,
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: 'Cancelled',
          borderColor: 'border-red-200'
        };
      case 'processing':
        return {
            icon: <Loader className="w-4 h-4" />,
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            label: 'Processing',
            borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          label: status || 'Unknown',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Action handlers (placeholders)
    const handleAction = async(status: string) => {
        // Implement action handling logic here
        console.log(`Action triggered: ${status}`);
        try {
            const input = {
                orderId: o.id,
                status: status
            };
            const d = await updateOrder({ variables: { input } });
            console.log("Order updated:", d);
            onOpenChange(false);
            //
            // await updateOrder({ variables: { approveSeedLabelRequestId: d.id } });
            // setStatus("approved");
        } catch (error) {
            console.error("Error updating order:", error);
        }

    }


  const statusConfig = getStatusConfig(o.status);
  const isPurchaseOrder = orderType === 'made';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[700px] h-full overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className={`px-6 py-5 border-b ${isPurchaseOrder ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-emerald-600 to-emerald-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-white text-xl font-semibold">
                {isPurchaseOrder ? 'Purchase Order' : 'Sales Order'}
              </SheetTitle>
              <p className={`${isPurchaseOrder ? 'text-blue-100' : 'text-emerald-100'} text-sm mt-1`}>
                Order details and transaction information
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isPurchaseOrder ? 'bg-green-800/50' : 'bg-emerald-800/50'}`}>
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Order ID & Status Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Order ID</div>
                    <div className="text-2xl font-bold text-gray-900">#{o.id || '—'}</div>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.text} font-medium text-sm border ${statusConfig.borderColor}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-100">
                <Calendar className="w-4 h-4" />
                <span>Ordered on {formatDate(o.created_at)}</span>
              </div>
            </CardContent>
          </Card>
            <div className="flex flex-col md:flex-row items-start gap-8">

  {/* Buyer Information */}
  <div className="flex-1">
    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <User className="w-4 h-4" />
      Buyer Information
    </h3>

    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-5 space-y-4">
        {/* Avatar + Basic Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-blue-700">
              {o.Buyer?.name?.charAt(0)?.toUpperCase() ||
                o.Buyer?.username?.charAt(0)?.toUpperCase() ||
                "?"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900">
              {o.Buyer?.name || "—"}
            </div>

            <div className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              @{o.Buyer?.username || "—"}
            </div>
          </div>
        </div>

        {/* Contact Details */}
        {(o.Buyer?.email || o.Buyer?.phone) && (
          <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100">
            {o.Buyer?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{o.Buyer.email}</span>
              </div>
            )}
            {o.Buyer?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{o.Buyer.phone}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  </div>

  {/* Seller Information */}
  <div className="flex-1">
    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <Building2 className="w-4 h-4" />
      Seller Information
    </h3>

    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-5 space-y-4">
        {/* Avatar + Basic Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-emerald-700">
              {o.Seller?.name?.charAt(0)?.toUpperCase() ||
                o.Seller?.username?.charAt(0)?.toUpperCase() ||
                "?"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900">
              {o.Seller?.name || "—"}
            </div>

            <div className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              @{o.Seller?.username || "—"}
            </div>
          </div>
        </div>

        {/* Contact Details */}
        {(o.Seller?.email || o.Seller?.phone) && (
          <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100">
            {o.Seller?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{o.Seller.email}</span>
              </div>
            )}
            {o.Seller?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{o.Seller.phone}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  </div>

</div>


          {/* Order Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Details
            </h3>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Weight className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="text-xl font-bold text-gray-900">{o.quantity ?? '—'} bags</div>
                    </div>
                  </div>
                  {o.product_id && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Product ID</div>
                      <div className="text-sm font-medium text-gray-900">{o.product_id}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comment */}
          {o.comment && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Additional Notes
              </h3>
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">{o.comment}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-11 border-gray-300"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {o.status?.toLowerCase() === 'pending' && orderType === 'received' && (
              <>
                <Button 
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={()=> handleAction('processing')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Order
                </Button>
                </>
            )}
            {o.status?.toLowerCase() === 'processing' && orderType === 'received' && (
              <>
                 <Button 
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={()=> handleAction('delivered')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Delivered
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 h-11 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={()=> handleAction('canceled')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              </>
            )}
                
              
          </div>

          {/* Status Information Notice */}
          {o.status?.toLowerCase() === 'pending'&& orderType === 'received'  && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">Action Required</div>
                <div className="text-amber-700">
                  This order is pending confirmation. Please review the details and take appropriate action.
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsSheet;