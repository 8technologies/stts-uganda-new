import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { KeenIcon } from '@/components';
import {
  CREATE_PRE_ORDER,
  DELETE_PRE_ORDER,
  MARK_PRE_ORDER_PICKED,
  UPDATE_PRE_ORDER,
} from '@/gql/mutations';
import { LOAD_CROPS, LOAD_USERS, PRE_ORDERS } from '@/gql/queries';
import { toast } from 'sonner';
import {
  Calendar,
  Check,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import PreOrderFormSheet, {
  PreOrderFormValues,
} from './PreOrderFormSheet.tsx';
import PreOrderDetailsSheet from './PreOrderDetailsSheet';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';

type CropVariety = {
  id: string;
  name: string;
};

type CropItem = {
  id: string;
  name: string;
  varieties?: CropVariety[];
};

type PreOrderVariety = {
  varietyId: string;
  varietyName?: string | null;
  quantity: number;
};

type PreOrderCrop = {
  cropId: string;
  cropName?: string | null;
  varieties: PreOrderVariety[];
};

type PreOrderItem = {
  id: string;
  breeder_id?: string | null;
  seed_class?: string | null;
  pickup_location?: string | null;
  detail?: string | null;
  status?: string | null;
  comment?: string | null;
  created_at?: string | null;
  collection_date?: string | null;
  supplyDate?: string | null;

  crops: PreOrderCrop[];

  createdBy?: {
    id: string;
    name?: string | null;
  } | null;

  breeder?: {
    name?: string | null;
    username?: string | null;
  } | null;
};

type CropsQueryData = {
  crops: {
    items: CropItem[];
  };
};

type BreederItem = {
  id: string;
  name?: string | null;
  username?: string | null;
  role_name?: string | null;
};

type BreedersQueryData = {
  users: BreederItem[];
};

type PreOrdersQueryData = {
  getPreOrders: PreOrderItem[];
};

type PreOrderMutationResult = {
  success: boolean;
  message?: string | null;
};

type SavePreOrderMutationData = {
  savePreOrder: PreOrderMutationResult;
};

type UpdatePreOrderMutationData = {
  updatePreOrder: PreOrderMutationResult;
};

type DeletePreOrderMutationData = {
  deletePreOrder: PreOrderMutationResult;
};

const defaultForm: PreOrderFormValues = {
  crops: [],
  breederId: '',
  seedClass: '',
  requestedDate: '',
  pickup_location: '',
  comment: '',
  status: 'pending',
};

const PreOrdersPage: React.FC = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');

  const [editingPreOrder, setEditingPreOrder] =
    useState<PreOrderItem | null>(null);

  const [selectedPreOrder, setSelectedPreOrder] =
    useState<PreOrderItem | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { auth } = useAuthContext();

  const perms = getPermissionsFromToken(auth?.access_token);

  const canCreatePreOrders = !!perms['can_create_pre_orders'];
  const canReceivePreOrders = !!perms['can_receive_pre_orders'];

  const {
    data: preOrdersData,
    loading: preOrdersLoading,
    error: preOrdersError,
    refetch: refetchPreOrders,
  } = useQuery<PreOrdersQueryData>(PRE_ORDERS, {
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: cropsData,
    loading: cropsLoading,
  } = useQuery<CropsQueryData>(LOAD_CROPS, {
    fetchPolicy: 'cache-first',
  });

  const {
    data: breedersData,
    loading: breedersLoading,
  } = useQuery<BreedersQueryData>(LOAD_USERS, {
    variables: {
      limit: 1000,
      offset: 0,
      roleName: 'breeder',
    },
    fetchPolicy: 'cache-first',
  });

  const [savePreOrder, { loading: creating }] =
    useMutation<SavePreOrderMutationData>(CREATE_PRE_ORDER, {
      refetchQueries: [{ query: PRE_ORDERS }],
      awaitRefetchQueries: true,
    });

  const [updatePreOrder, { loading: updating }] =
    useMutation<UpdatePreOrderMutationData>(UPDATE_PRE_ORDER, {
      refetchQueries: [{ query: PRE_ORDERS }],
      awaitRefetchQueries: true,
    });

  const [deletePreOrder, { loading: deleting }] =
    useMutation<DeletePreOrderMutationData>(DELETE_PRE_ORDER, {
      refetchQueries: [{ query: PRE_ORDERS }],
      awaitRefetchQueries: true,
    });

  const [markPreOrderPicked, { loading: markingPicked }] =
    useMutation<UpdatePreOrderMutationData>(MARK_PRE_ORDER_PICKED, {
      refetchQueries: [{ query: PRE_ORDERS }],
      awaitRefetchQueries: true,
    });

  const crops: CropItem[] = cropsData?.crops?.items ?? [];
  const breeders: BreederItem[] = breedersData?.users ?? [];
  const preOrders: PreOrderItem[] =
    preOrdersData?.getPreOrders ?? [];

  /*
   * Get a readable summary of all crops in a preorder.
   */
  const getCropNames = (order: PreOrderItem) => {
    return (order.crops ?? [])
      .map((crop) => crop.cropName || `Crop ${crop.cropId}`)
      .join(', ');
  };

  /*
   * Get a readable summary of all varieties in a preorder.
   */
  const getVarietyNames = (order: PreOrderItem) => {
    return (order.crops ?? [])
      .flatMap((crop) =>
        (crop.varieties ?? []).map(
          (variety) =>
            variety.varietyName ||
            `Variety ${variety.varietyId}`
        )
      )
      .join(', ');
  };

  /*
   * Calculate total quantity across all varieties.
   */
  const getTotalQuantity = (order: PreOrderItem) => {
    return (order.crops ?? []).reduce((cropTotal, crop) => {
      return (
        cropTotal +
        (crop.varieties ?? []).reduce(
          (varietyTotal, variety) =>
            varietyTotal + Number(variety.quantity || 0),
          0
        )
      );
    }, 0);
  };

  const filteredPreOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = [...preOrders];

    if (q) {
      result = result.filter((order) => {
        const crop = getCropNames(order).toLowerCase();
        const variety = getVarietyNames(order).toLowerCase();
        const comment = String(
          order.comment ?? ''
        ).toLowerCase();
        const id = String(order.id ?? '').toLowerCase();

        return (
          crop.includes(q) ||
          variety.includes(q) ||
          comment.includes(q) ||
          id.includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(
        (order) =>
          String(order.status ?? '').toLowerCase() ===
          statusFilter
      );
    }

    return result.sort(
      (a, b) =>
        new Date(
          String(b.created_at ?? 0)
        ).getTime() -
        new Date(
          String(a.created_at ?? 0)
        ).getTime()
    );
  }, [preOrders, search, statusFilter]);

  const formatDate = (isoDate?: string | null) => {
    if (!isoDate) return '-';

    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusClasses = (status?: string | null) => {
    switch (String(status ?? '').toLowerCase()) {
      case 'approved':
      case 'accepted':
      case 'confirmed':
      case 'completed':
      case 'delivered':
      case 'picked':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';

      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';

      case 'rejected':
      case 'declined':
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-700 border-red-200';

      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const toDateInputValue = (
    isoDate?: string | null
  ) => {
    if (!isoDate) return '';

    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().split('T')[0];
  };

  /*
   * Convert the JSON returned by the backend into
   * the structure expected by the form.
   */
  const getInitialFormValues = (
    order?: PreOrderItem | null
  ): PreOrderFormValues => {
    if (!order) {
      return defaultForm;
    }

    return {
      crops: (order.crops ?? []).map((crop) => ({
        cropId: String(crop.cropId),
        cropName: crop.cropName ?? '',
        varieties: (crop.varieties ?? []).map(
          (variety) => ({
            varietyId: String(variety.varietyId),
            varietyName: variety.varietyName ?? '',
            quantity: String(
              variety.quantity ?? ''
            ),
          })
        ),
      })),

      breederId: String(
        order.breeder_id ?? ''
      ),

      seedClass: String(
        order.seed_class ?? ''
      ),

      requestedDate: toDateInputValue(
        order.collection_date
      ),

      pickup_location: String(
        order.pickup_location ?? ''
      ),

      comment:
        order.comment ??
        order.detail ??
        '',

      status: String(
        order.status ?? 'pending'
      ).toLowerCase(),
    };
  };

  const openCreateSheet = () => {
    setEditingPreOrder(null);
    setSheetMode('create');
    setSheetOpen(true);
  };

  const openEditSheet = (
    order: PreOrderItem
  ) => {
    setEditingPreOrder(order);
    setSheetMode('edit');
    setSheetOpen(true);
  };

  const openDetailsSheet = (
    order: PreOrderItem
  ) => {
    setSelectedPreOrder(order);
    setDetailsOpen(true);
  };

  /*
   * Submit multiple crops and multiple varieties.
   */
  const handleSheetSubmit = async ({
    values,
    mode,
  }: {
    values: PreOrderFormValues;
    mode: 'create' | 'edit';
  }) => {
    try {
      if (
        !values.crops ||
        values.crops.length === 0
      ) {
        toast.error(
          'Please select at least one crop.'
        );
        return;
      }

      /*
       * Validate every crop and variety.
       */
      for (const crop of values.crops) {
        if (!crop.cropId) {
          toast.error(
            'Every crop must have a valid crop selected.'
          );
          return;
        }

        if (
          !crop.varieties ||
          crop.varieties.length === 0
        ) {
          toast.error(
            'Every crop must have at least one variety.'
          );
          return;
        }

        for (const variety of crop.varieties) {
          const quantity = Number(
            variety.quantity
          );

          if (
            !variety.varietyId ||
            !quantity ||
            quantity <= 0
          ) {
            toast.error(
              'Every variety must have a valid quantity.'
            );
            return;
          }
        }
      }

      const id =
        mode === 'edit' &&
        editingPreOrder
          ? editingPreOrder.id
          : undefined;

      /*
       * Prepare the JSON data sent to GraphQL.
       */
      const preorderCrops = values.crops.map(
        (crop) => ({
          cropId: String(crop.cropId),

          /*
           * Sending names is optional, but useful if
           * the backend stores a snapshot in JSON.
           */
          cropName: crop.cropName || null,

          varieties: crop.varieties.map(
            (variety) => ({
              varietyId: String(
                variety.varietyId
              ),
              varietyName:
                variety.varietyName ||
                null,
              quantity: Number(
                variety.quantity
              ),
            })
          ),
        })
      );

      const response =
        await savePreOrder({
          variables: {
            input: {
              id,

              breederId:
                values.breederId ||
                null,

              crops: preorderCrops,

              seedClass:
                values.seedClass.trim() ||
                null,

              requestedDate:
                values.requestedDate,

              pickup_location:
                values.pickup_location.trim() ||
                null,

              comment:
                values.comment.trim() ||
                null,
            },
          },
        });

      if (
        response.data?.savePreOrder?.success
      ) {
        toast.success(
          response.data.savePreOrder
            .message ||
            'Pre-order submitted.'
        );

        setSheetOpen(false);
        setEditingPreOrder(null);
      } else {
        toast.error(
          response.data?.savePreOrder
            ?.message ||
            'Failed to submit pre-order.'
        );
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Request failed.'
      );
    }
  };

  const handleDelete = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      'Delete this pre-order request?'
    );

    if (!confirmed) return;

    try {
      const response =
        await deletePreOrder({
          variables: { id },
        });

      if (
        response.data?.deletePreOrder
          ?.success
      ) {
        toast.success(
          response.data.deletePreOrder
            .message ||
            'Pre-order deleted.'
        );
      } else {
        toast.error(
          response.data?.deletePreOrder
            ?.message ||
            'Failed to delete pre-order.'
        );
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Failed to delete pre-order.'
      );
    }
  };

  const handleMarkPicked = async (
    preOrder: PreOrderItem
  ) => {
    if (!preOrder.id) {
      return;
    }

    try {
      const response =
        await markPreOrderPicked({
          variables: {
            id: preOrder.id,
            comment:
              'Picked up by the breeder.',
          },
        });

      if (
        response.data?.updatePreOrder
          ?.success
      ) {
        toast.success(
          response.data.updatePreOrder
            .message ||
            'Pre-order marked as picked.'
        );
      } else {
        toast.error(
          response.data?.updatePreOrder
            ?.message ||
            'Failed to mark pre-order as picked.'
        );
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Failed to mark pre-order as picked.'
      );
    }
  };

  const handleModerationAction = async ({
    status,
    moderationComment,
    supplyDate,
  }: {
    status:
      | 'accepted'
      | 'rejected'
      | 'delivered';
    supplyDate?: string;
    moderationComment: string;
  }) => {
    if (!selectedPreOrder?.id) {
      return;
    }

    try {
      const response =
        await updatePreOrder({
          variables: {
            id: selectedPreOrder.id,
            input: {
              status,
              supplyDate:
                status === 'accepted'
                  ? supplyDate
                  : null,
              comment:
                moderationComment ||
                null,
            },
          },
        });

      if (
        response.data?.updatePreOrder
          ?.success
      ) {
        toast.success(
          response.data.updatePreOrder
            .message ||
            `Pre-order ${status}.`
        );

        setDetailsOpen(false);
        setSelectedPreOrder(null);
      } else {
        toast.error(
          response.data?.updatePreOrder
            ?.message ||
            `Failed to mark as ${status}.`
        );
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Failed to update pre-order status.'
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Pre-orders
          </h1>

          <p className="text-sm text-gray-600">
            Request seed supply in advance and
            track request status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() =>
              refetchPreOrders()
            }
          >
            <KeenIcon
              icon="refresh"
              className="mr-1"
            />
            Refresh
          </button>

          {canCreatePreOrders && (
            <button
              className="btn btn-primary"
              onClick={openCreateSheet}
            >
              <Plus className="w-4 h-4 mr-1" />
              New pre-order
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      <PreOrderFormSheet
        open={sheetOpen}
        mode={sheetMode}
        crops={crops}
        breeders={breeders}
        loading={
          cropsLoading ||
          breedersLoading ||
          creating ||
          updating
        }
        initialValues={getInitialFormValues(
          editingPreOrder
        )}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setEditingPreOrder(null);
            setSheetMode('create');
          }
        }}
        onSubmit={handleSheetSubmit}
      />

      {/* Details */}
      <PreOrderDetailsSheet
        open={detailsOpen}
        preOrder={selectedPreOrder}
        loading={updating}
        canReceivePreOrders={
          canReceivePreOrders
        }
        onOpenChange={(open) => {
          setDetailsOpen(open);

          if (!open) {
            setSelectedPreOrder(null);
          }
        }}
        onApprove={({
          collectionDate,
          notes,
        }) =>
          handleModerationAction({
            status: 'accepted',
            supplyDate: collectionDate,
            moderationComment: `${
              notes
                ? `\nNotes: ${notes}`
                : ''
            }`,
          })
        }
        onReject={(reason) =>
          handleModerationAction({
            status: 'rejected',
            moderationComment:
              `Rejection reason: ${reason}`,
          })
        }
        onConfirmDelivered={({
          notes,
        }) =>
          handleModerationAction({
            status: 'delivered',
            moderationComment: notes
              ? `Delivery confirmed: ${notes}`
              : 'Delivery confirmed.',
          })
        }
      />

      {/* Search / Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <KeenIcon icon="magnifier" />
            </span>

            <input
              className="w-full pl-10 pr-3 py-2 rounded-lg border bg-white text-sm"
              placeholder="Search by ID, crop, variety, or comment"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <select
          className="px-3 py-2 rounded-lg border bg-white text-sm"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All status
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="accepted">
            Accepted
          </option>
          <option value="rejected">
            Rejected
          </option>
          <option value="delivered">
            Delivered
          </option>
          <option value="completed">
            Completed
          </option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">

        {preOrdersLoading && (
          <div className="p-6 text-center text-gray-600">
            Loading pre-orders...
          </div>
        )}

        {preOrdersError && (
          <div className="p-6 text-center text-red-600">
            Failed to load pre-orders.{' '}
            {preOrdersError.message}
          </div>
        )}

        {!preOrdersLoading &&
          !preOrdersError &&
          filteredPreOrders.length === 0 && (
            <div className="p-6 text-center text-gray-600">
              No pre-orders found.
            </div>
          )}

        {!preOrdersLoading &&
          !preOrdersError &&
          filteredPreOrders.length > 0 && (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-sm">

                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      ID
                    </th>

                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Crops & Varieties
                    </th>

                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Total Quantity
                    </th>

                    {canReceivePreOrders ? (
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        Requested by
                      </th>
                    ) : (
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        Breeder
                      </th>
                    )}

                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Requested
                    </th>

                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Status
                    </th>

                    {/* <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Comment
                    </th> */}

                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPreOrders.map(
                    (preOrder) => {
                      const requestDate =
                        preOrder.collection_date ||
                        preOrder.created_at;

                      const status =
                        preOrder.status ||
                        'pending';

                      const totalQuantity =
                        getTotalQuantity(
                          preOrder
                        );

                      return (
                        <tr
                          key={preOrder.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >

                          {/* ID */}
                          <td className="px-4 py-3 font-medium text-gray-900">
                            #{preOrder.id}
                          </td>

                          {/* Crops / varieties */}
                          <td className="px-4 py-3 text-gray-700 min-w-[300px]">
                            <div className="space-y-2">
                              {(preOrder.crops ?? []).map(
                                (crop) => (
                                  <div
                                    key={
                                      crop.cropId
                                    }
                                  >
                                    <div className="font-medium text-gray-900">
                                      {crop.cropName ||
                                        `Crop ${crop.cropId}`}
                                    </div>

                                    <div className="mt-1 space-y-1">
                                      {(
                                        crop.varieties ??
                                        []
                                      ).map(
                                        (
                                          variety
                                        ) => (
                                          <div
                                            key={
                                              variety.varietyId
                                            }
                                            className="flex items-center justify-between text-xs text-gray-600"
                                          >
                                            <span>
                                              {variety.varietyName ||
                                                `Variety ${variety.varietyId}`}
                                            </span>

                                            <span className="font-medium ml-3">
                                              {Number(
                                                variety.quantity
                                              ).toLocaleString()}{' '}
                                              kg
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </td>

                          {/* Total quantity */}
                          <td className="px-4 py-3 text-gray-700 font-medium">
                            {totalQuantity.toLocaleString()}{' '}
                            kg
                          </td>

                          {/* Requester / Breeder */}
                          {canReceivePreOrders ? (
                            <td className="px-4 py-3 text-gray-700">
                              {preOrder
                                ?.createdBy
                                ?.name || '-'}
                            </td>
                          ) : (
                            <td className="px-4 py-3 text-gray-700">
                              {preOrder
                                ?.breeder
                                ?.name || '-'}
                            </td>
                          )}

                          {/* Requested date */}
                          <td className="px-4 py-3 text-gray-700">
                            <div className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(
                                requestDate
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full font-medium text-xs border ${getStatusClasses(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>

                          {/* Comment */}
                          {/* <td
                            className="px-4 py-3 text-gray-600 max-w-[260px] truncate"
                            title={
                              preOrder.comment ||
                              ''
                            }
                          >
                            {preOrder.comment ||
                              '-'}
                          </td> */}

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div
                              className="relative"
                              ref={
                                openMenuId ===
                                preOrder.id
                                  ? menuRef
                                  : undefined
                              }
                            >
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost p-2"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  setOpenMenuId(
                                    openMenuId ===
                                      preOrder.id
                                      ? null
                                      : preOrder.id
                                  );
                                }}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {openMenuId ===
                                preOrder.id && (
                                <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">

                                  {/* View */}
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => {
                                      openDetailsSheet(
                                        preOrder
                                      );
                                      setOpenMenuId(
                                        null
                                      );
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </button>

                                  {/* Edit / Delete */}
                                  {canCreatePreOrders &&
                                    preOrder.status ===
                                      'pending' && (
                                      <>
                                        <button
                                          type="button"
                                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                          onClick={() => {
                                            openEditSheet(
                                              preOrder
                                            );
                                            setOpenMenuId(
                                              null
                                            );
                                          }}
                                        >
                                          <Pencil className="w-4 h-4" />
                                          Edit
                                        </button>

                                        <button
                                          type="button"
                                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                          onClick={() => {
                                            handleDelete(
                                              preOrder.id
                                            );
                                            setOpenMenuId(
                                              null
                                            );
                                          }}
                                          disabled={
                                            deleting
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Delete
                                        </button>
                                      </>
                                    )}

                                  {/* Mark picked */}
                                  {canCreatePreOrders &&
                                    preOrder.status ===
                                      'delivered' && (
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => {
                                          setOpenMenuId(
                                            null
                                          );
                                          handleMarkPicked(
                                            preOrder
                                          );
                                        }}
                                        disabled={
                                          markingPicked
                                        }
                                      >
                                        <Check className="w-4 h-4" />
                                        Mark as Picked
                                      </button>
                                    )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {!preOrdersLoading &&
        !preOrdersError &&
        filteredPreOrders.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">
              {filteredPreOrders.length}
            </span>{' '}
            pre-order request(s) displayed.
          </div>
        )}
    </div>
  );
};

export default PreOrdersPage;
