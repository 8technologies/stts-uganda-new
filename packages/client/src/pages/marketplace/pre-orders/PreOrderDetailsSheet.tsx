import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import {
  Calendar,
  CheckCircle2,
  CircleX,
  MapPin,
  Sprout,
  UserRound,
} from 'lucide-react';

type PreOrderVariety = {
  varietyId: string;
  varietyName?: string | null;
  quantity: number | string;
};

type PreOrderCrop = {
  cropId: string;
  cropName?: string | null;
  varieties: PreOrderVariety[];
};

type PreOrderItem = {
  id: string;

  crops?: PreOrderCrop[] | null;

  status?: string | null;
  comment?: string | null;
  detail?: string | null;
  seed_class?: string | null;
  pickup_location?: string | null;
  created_at?: string | null;
  collection_date?: string | null;

  createdBy?: {
    name?: string | null;
    username?: string | null;
  } | null;

  breeder?: {
    name?: string | null;
    username?: string | null;
  } | null;
};

type Props = {
  open: boolean;
  preOrder: PreOrderItem | null;
  loading?: boolean;
  canReceivePreOrders?: boolean;
  onOpenChange: (open: boolean) => void;

  onApprove: (payload: {
    collectionDate: string;
    notes: string;
  }) => Promise<void>;

  onReject: (reason: string) => Promise<void>;

  onConfirmDelivered: (payload: {
    notes: string;
  }) => Promise<void>;
};

const PreOrderDetailsSheet: React.FC<Props> = ({
  open,
  preOrder,
  loading = false,
  canReceivePreOrders = false,
  onOpenChange,
  onApprove,
  onReject,
  onConfirmDelivered,
}) => {
  const item = preOrder;

  const [
    actionMode,
    setActionMode,
  ] = React.useState<
    null | 'approve' | 'reject' | 'deliver'
  >(null);

  const [supplyDate, setSupplyDate] =
    React.useState('');

  const [approveNotes, setApproveNotes] =
    React.useState('');

  const [rejectReason, setRejectReason] =
    React.useState('');

  const [deliveryNotes, setDeliveryNotes] =
    React.useState('');

  React.useEffect(() => {
    if (!open) {
      setActionMode(null);
      setSupplyDate('');
      setApproveNotes('');
      setRejectReason('');
      setDeliveryNotes('');
    }
  }, [open, item?.id]);

  const formatDate = (
    isoDate?: string | null
  ) => {
    if (!isoDate) return '-';

    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  const status = String(
    item?.status ?? 'pending'
  ).toLowerCase();

  const canApproveOrReject =
    canReceivePreOrders &&
    status === 'pending';

  const canConfirmDelivery =
    canReceivePreOrders &&
    status === 'accepted';

  const canTakeAction =
    canApproveOrReject ||
    canConfirmDelivery;

  /**
   * Calculate total requested quantity
   * across all crops and varieties.
   */
  const totalQuantity =
    item?.crops?.reduce(
      (cropTotal, crop) =>
        cropTotal +
        (crop.varieties?.reduce(
          (varietyTotal, variety) =>
            varietyTotal +
            Number(
              variety.quantity || 0
            ),
          0
        ) || 0),
      0
    ) || 0;

  const submitApprove = async () => {
    if (!supplyDate) return;

    await onApprove({
      collectionDate: supplyDate,
      notes: approveNotes.trim(),
    });
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return;

    await onReject(
      rejectReason.trim()
    );
  };

  const submitDelivered = async () => {
    await onConfirmDelivered({
      notes: deliveryNotes.trim(),
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[700px] overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 py-5 border-b bg-primary text-primary-foreground">
          <SheetTitle className="text-primary-foreground text-xl font-semibold">
            Pre-order details
          </SheetTitle>

          <p className="text-primary-foreground/80 text-sm mt-1">
            Review request information and
            take approval action.
          </p>
        </SheetHeader>

        {item ? (
          <div className="p-6 space-y-5">

            {/* Request header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Request ID
                </div>

                <div className="text-xl font-semibold text-gray-900">
                  #{item.id}
                </div>
              </div>

              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border-gray-200">
                {status}
              </span>
            </div>

            {/* Crops and varieties */}
            <div className="rounded-lg border p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1">
                <Sprout className="w-3 h-3" />
                Crops & varieties
              </div>

              {!item.crops ||
              item.crops.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No crops specified.
                </div>
              ) : (
                <div className="space-y-4">
                  {item.crops.map(
                    (
                      crop,
                      cropIndex
                    ) => (
                      <div
                        key={
                          crop.cropId ||
                          cropIndex
                        }
                        className="rounded-lg border bg-gray-50 p-3"
                      >
                        <div className="font-semibold text-gray-900 mb-2">
                          {crop.cropName ||
                            `Crop #${
                              crop.cropId
                            }`}
                        </div>

                        <div className="space-y-2">
                          {crop.varieties?.map(
                            (
                              variety,
                              varietyIndex
                            ) => (
                              <div
                                key={
                                  variety.varietyId ||
                                  varietyIndex
                                }
                                className="flex items-center justify-between bg-white rounded-md border px-3 py-2"
                              >
                                <div className="text-sm text-gray-700">
                                  {variety.varietyName ||
                                    `Variety #${
                                      variety.varietyId
                                    }`}
                                </div>

                                <div className="text-sm font-semibold text-gray-900">
                                  {Number(
                                    variety.quantity ||
                                      0
                                  ).toLocaleString()}{' '}
                                  kg
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* Total quantity */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm font-medium text-gray-700">
                      Total quantity
                    </span>

                    <span className="font-semibold text-gray-900">
                      {totalQuantity.toLocaleString()}{' '}
                      kg
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Seed class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500 mb-1">
                  Seed class
                </div>

                <div className="font-medium text-gray-900">
                  {item.seed_class ||
                    '-'}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Pickup location
                </div>

                <div className="font-medium text-gray-900">
                  {item.pickup_location ||
                    '-'}
                </div>
              </div>
            </div>

            {/* Requested date */}
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Requested date
              </div>

              <div className="font-medium text-gray-900">
                {formatDate(
                  item.collection_date
                )}
              </div>
            </div>

            {/* Requested by / breeder */}
            {canReceivePreOrders ? (
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
                  <UserRound className="w-3 h-3" />
                  Requested by
                </div>

                <div className="font-medium text-gray-900">
                  {item.createdBy?.name ||
                    item.createdBy
                      ?.username ||
                    '-'}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
                  <UserRound className="w-3 h-3" />
                  Breeder
                </div>

                <div className="font-medium text-gray-900">
                  {item.breeder?.name ||
                    item.breeder
                      ?.username ||
                    '-'}
                </div>
              </div>
            )}

            {/* Comment */}
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
                <Sprout className="w-3 h-3" />
                Comment
              </div>

              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {item.detail || '-'}
              </div>
            </div>

            {/* Breeder response */}
            {status !== 'pending' && (
              <>
                <div className="text-xs uppercase tracking-wide text-gray-500 pt-4 mb-1 text-center">
                  Breeder's response
                </div>

                <div className="rounded-lg border-l-4 border-green-500 bg-green-50/50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Response date
                  </div>

                  <div className="text-sm text-gray-900">
                    {formatDate(
                      item.created_at
                    )}
                  </div>
                </div>

                <div className="rounded-lg border-l-4 border-green-500 bg-green-50/50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Breeder's response
                  </div>

                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {item.comment ||
                      '-'}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            {canTakeAction && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs uppercase tracking-wide text-gray-500 pt-4 mb-1 text-center">
                  Breeder's response
                </div>

                <div className="text-sm font-medium text-gray-900 mb-2">
                  Select Action
                </div>

                <div className="flex flex-wrap items-center gap-6">

                  {/* Approve */}
                  {canApproveOrReject && (
                    <>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="moderation-action"
                          value="approve"
                          checked={
                            actionMode ===
                            'approve'
                          }
                          onChange={() =>
                            setActionMode(
                              'approve'
                            )
                          }
                          disabled={loading}
                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />

                        <span className="inline-flex items-center text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 mr-1 text-primary-600" />
                          Approve
                        </span>
                      </label>

                      {/* Reject */}
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="moderation-action"
                          value="reject"
                          checked={
                            actionMode ===
                            'reject'
                          }
                          onChange={() =>
                            setActionMode(
                              'reject'
                            )
                          }
                          disabled={loading}
                          className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />

                        <span className="inline-flex items-center text-sm text-gray-700">
                          <CircleX className="w-4 h-4 mr-1 text-red-600" />
                          Reject
                        </span>
                      </label>
                    </>
                  )}

                  {/* Confirm delivery */}
                  {canConfirmDelivery && (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="moderation-action"
                        value="deliver"
                        checked={
                          actionMode ===
                          'deliver'
                        }
                        onChange={() =>
                          setActionMode(
                            'deliver'
                          )
                        }
                        disabled={loading}
                        className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />

                      <span className="inline-flex items-center text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                        Confirm delivery
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Approve */}
            {canTakeAction &&
              actionMode ===
                'approve' && (
                <div className="rounded-lg border p-4 space-y-3 bg-green-50/50">
                  <div className="text-sm font-medium text-gray-900">
                    Approve Request
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 block mb-1">
                      Supply date
                    </label>

                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      value={supplyDate}
                      onChange={(
                        event
                      ) =>
                        setSupplyDate(
                          event.target
                            .value
                        )
                      }
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 block mb-1">
                      Notes
                    </label>

                    <textarea
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      rows={3}
                      value={approveNotes}
                      onChange={(
                        event
                      ) =>
                        setApproveNotes(
                          event.target
                            .value
                        )
                      }
                      placeholder="Add approval notes"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        setActionMode(
                          null
                        )
                      }
                      disabled={
                        loading
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={
                        submitApprove
                      }
                      disabled={
                        loading ||
                        !supplyDate
                      }
                    >
                      {loading
                        ? 'Processing...'
                        : 'Confirm Approval'}
                    </button>
                  </div>
                </div>
              )}

            {/* Reject */}
            {canTakeAction &&
              actionMode ===
                'reject' && (
                <div className="rounded-lg border p-4 space-y-3 bg-red-50/50">
                  <div className="text-sm font-medium text-gray-900">
                    Reject Request
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 block mb-1">
                      Reason
                    </label>

                    <textarea
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      rows={3}
                      value={rejectReason}
                      onChange={(
                        event
                      ) =>
                        setRejectReason(
                          event.target
                            .value
                        )
                      }
                      placeholder="Provide rejection reason"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        setActionMode(
                          null
                        )
                      }
                      disabled={
                        loading
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={
                        submitReject
                      }
                      disabled={
                        loading ||
                        !rejectReason.trim()
                      }
                    >
                      {loading
                        ? 'Processing...'
                        : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}

            {/* Confirm delivery */}
            {canTakeAction &&
              actionMode ===
                'deliver' && (
                <div className="rounded-lg border p-4 space-y-3 bg-emerald-50/50">
                  <div className="text-sm font-medium text-gray-900">
                    Confirm Delivery
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 block mb-1">
                      Delivery notes
                    </label>

                    <textarea
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      rows={3}
                      value={deliveryNotes}
                      onChange={(
                        event
                      ) =>
                        setDeliveryNotes(
                          event.target
                            .value
                        )
                      }
                      placeholder="Add delivery confirmation notes"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        setActionMode(
                          null
                        )
                      }
                      disabled={
                        loading
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={
                        submitDelivered
                      }
                      disabled={
                        loading
                      }
                    >
                      {loading
                        ? 'Processing...'
                        : 'Confirm Delivery'}
                    </button>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-600">
            No request selected.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PreOrderDetailsSheet;