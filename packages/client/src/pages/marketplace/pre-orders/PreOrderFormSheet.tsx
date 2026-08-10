
import React, { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Trash2 } from 'lucide-react';

type CropVariety = {
  id: string;
  name: string;
};

type CropItem = {
  id: string;
  name: string;
  varieties?: CropVariety[];
};

type BreederItem = {
  id: string;
  name?: string | null;
  username?: string | null;
};

/**
 * A variety selected under a crop.
 */
export type PreOrderVarietyValue = {
  varietyId: string;
  varietyName: string;
  quantity: string;
};

/**
 * A crop selected for the preorder.
 */
export type PreOrderCropValue = {
  cropId: string;
  cropName: string;
  varieties: PreOrderVarietyValue[];
};

/**
 * Complete preorder form.
 */
export type PreOrderFormValues = {
  crops: PreOrderCropValue[];
  breederId: string;
  seedClass: string;
  requestedDate: string;
  pickup_location: string;
  comment: string;
  status: string;
};

type SubmitPayload = {
  values: PreOrderFormValues;
  mode: 'create' | 'edit';
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  crops: CropItem[];
  breeders: BreederItem[];
  loading?: boolean;
  initialValues: PreOrderFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: SubmitPayload
  ) => Promise<void>;
};

const emptyForm: PreOrderFormValues = {
  crops: [],
  breederId: '',
  seedClass: '',
  requestedDate: '',
  pickup_location: '',
  comment: '',
  status: 'pending',
};

const PreOrderFormSheet: React.FC<Props> = ({
  open,
  mode,
  crops,
  breeders,
  loading = false,
  initialValues,
  onOpenChange,
  onSubmit,
}) => {
  const [form, setForm] =
    useState<PreOrderFormValues>(
      initialValues || emptyForm
    );

  useEffect(() => {
    if (open) {
      setForm(
        initialValues || emptyForm
      );
    }
  }, [open, initialValues]);

  const isEdit = mode === 'edit';

  /**
   * Add a new crop to the preorder.
   */
  const addCrop = () => {
    setForm((prev) => ({
      ...prev,
      crops: [
        ...prev.crops,
        {
          cropId: '',
          cropName: '',
          varieties: [],
        },
      ],
    }));
  };

  /**
   * Remove a crop.
   */
  const removeCrop = (
    cropIndex: number
  ) => {
    setForm((prev) => ({
      ...prev,
      crops: prev.crops.filter(
        (_, index) =>
          index !== cropIndex
      ),
    }));
  };

  /**
   * Change the crop selected at a particular
   * crop index.
   */
  const handleCropChange = (
    cropIndex: number,
    cropId: string
  ) => {
    const selectedCrop = crops.find(
      (crop) =>
        String(crop.id) ===
        String(cropId)
    );

    setForm((prev) => ({
      ...prev,
      crops: prev.crops.map(
        (crop, index) =>
          index === cropIndex
            ? {
                ...crop,
                cropId,
                cropName:
                  selectedCrop?.name ||
                  '',
                varieties: [],
              }
            : crop
      ),
    }));
  };

  /**
   * Add a variety under a particular crop.
   */
  const addVariety = (
    cropIndex: number
  ) => {
    setForm((prev) => ({
      ...prev,
      crops: prev.crops.map(
        (crop, index) =>
          index === cropIndex
            ? {
                ...crop,
                varieties: [
                  ...crop.varieties,
                  {
                    varietyId: '',
                    varietyName: '',
                    quantity: '',
                  },
                ],
              }
            : crop
      ),
    }));
  };

  /**
   * Remove a variety from a crop.
   */
  const removeVariety = (
    cropIndex: number,
    varietyIndex: number
  ) => {
    setForm((prev) => ({
      ...prev,
      crops: prev.crops.map(
        (crop, index) =>
          index === cropIndex
            ? {
                ...crop,
                varieties:
                  crop.varieties.filter(
                    (_, index) =>
                      index !==
                      varietyIndex
                  ),
              }
            : crop
      ),
    }));
  };

  /**
   * Change a variety under a crop.
   */
  const handleVarietyChange = (
    cropIndex: number,
    varietyIndex: number,
    varietyId: string
  ) => {
    const selectedCrop =
      crops.find(
        (crop) =>
          String(crop.id) ===
          String(
            form.crops[cropIndex]
              ?.cropId
          )
      );

    const selectedVariety =
      selectedCrop?.varieties?.find(
        (variety) =>
          String(variety.id) ===
          String(varietyId)
      );

    setForm((prev) => ({
      ...prev,
      crops: prev.crops.map(
        (crop, cIndex) =>
          cIndex === cropIndex
            ? {
                ...crop,
                varieties:
                  crop.varieties.map(
                    (
                      variety,
                      vIndex
                    ) =>
                      vIndex ===
                      varietyIndex
                        ? {
                            ...variety,
                            varietyId,
                            varietyName:
                              selectedVariety?.name ||
                              '',
                          }
                        : variety
                  ),
              }
            : crop
      ),
    }));
  };

  /**
   * Change quantity for a variety.
   */
  const handleQuantityChange = (
    cropIndex: number,
    varietyIndex: number,
    quantity: string
  ) => {
    setForm((prev) => ({
      ...prev,
      crops: prev.crops.map(
        (crop, cIndex) =>
          cIndex === cropIndex
            ? {
                ...crop,
                varieties:
                  crop.varieties.map(
                    (
                      variety,
                      vIndex
                    ) =>
                      vIndex ===
                      varietyIndex
                        ? {
                            ...variety,
                            quantity,
                          }
                        : variety
                  ),
              }
            : crop
      ),
    }));
  };

  /**
   * Submit form.
   */
  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (form.crops.length === 0) {
      return;
    }

    await onSubmit({
      values: form,
      mode,
    });
  };

  /**
   * Total quantity across all varieties.
   */
  const totalQuantity = useMemo(() => {
    return form.crops.reduce(
      (cropTotal, crop) =>
        cropTotal +
        crop.varieties.reduce(
          (varietyTotal, variety) =>
            varietyTotal +
            Number(
              variety.quantity || 0
            ),
          0
        ),
      0
    );
  }, [form.crops]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit
              ? 'Edit pre-order request'
              : 'Create pre-order request'}
          </SheetTitle>

          <p className="text-sm text-gray-500">
            {isEdit
              ? 'Update your pre-order request.'
              : 'Submit your seed supply request in advance.'}
          </p>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          {/* Breeder */}
          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Breeder
            </label>

            <select
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
              value={form.breederId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  breederId:
                    event.target.value,
                }))
              }
              disabled={loading}
            >
              <option value="">
                Select breeder
              </option>

              {breeders.map(
                (breeder) => (
                  <option
                    key={breeder.id}
                    value={breeder.id}
                  >
                    {breeder.name ||
                      breeder.username ||
                      `Breeder #${breeder.id}`}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Crops */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Crops and varieties
                </label>

                <p className="text-xs text-gray-500 mt-1">
                  Add one or more crops and
                  select the varieties and
                  quantities required.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={addCrop}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add crop
              </button>
            </div>

            {form.crops.length === 0 && (
              <div className="border border-dashed rounded-lg p-6 text-center text-sm text-gray-500">
                No crops added yet.
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={addCrop}
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add first crop
                  </button>
                </div>
              </div>
            )}

            {form.crops.map(
              (crop, cropIndex) => {
                const selectedCrop =
                  crops.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        crop.cropId
                      )
                  );

                const varieties =
                  selectedCrop
                    ?.varieties ?? [];

                return (
                  <div
                    key={cropIndex}
                    className="border rounded-lg p-4 space-y-4 bg-gray-50"
                  >
                    {/* Crop header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800">
                        Crop {cropIndex + 1}
                      </h3>

                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700 p-1"
                        onClick={() =>
                          removeCrop(
                            cropIndex
                          )
                        }
                        disabled={
                          loading
                        }
                        title="Remove crop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Crop selection */}
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">
                        Crop
                      </label>

                      <select
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                        value={
                          crop.cropId
                        }
                        onChange={(
                          event
                        ) =>
                          handleCropChange(
                            cropIndex,
                            event.target
                              .value
                          )
                        }
                        disabled={
                          loading
                        }
                        required
                      >
                        <option value="">
                          Select crop
                        </option>

                        {crops.map(
                          (
                            cropItem
                          ) => (
                            <option
                              key={
                                cropItem.id
                              }
                              value={
                                cropItem.id
                              }
                            >
                              {
                                cropItem.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* Varieties */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Varieties
                        </label>

                        <button
                          type="button"
                          className="text-sm text-primary font-medium hover:underline"
                          onClick={() =>
                            addVariety(
                              cropIndex
                            )
                          }
                          disabled={
                            loading ||
                            !crop.cropId
                          }
                        >
                          + Add variety
                        </button>
                      </div>

                      {crop.varieties.length ===
                        0 && (
                        <div className="text-xs text-gray-500 border rounded-lg bg-white p-3">
                          Select a crop, then
                          add at least one
                          variety.
                        </div>
                      )}

                      {crop.varieties.map(
                        (
                          variety,
                          varietyIndex
                        ) => (
                          <div
                            key={
                              varietyIndex
                            }
                            className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2 items-end bg-white border rounded-lg p-3"
                          >
                            {/* Variety */}
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">
                                Variety
                              </label>

                              <select
                                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                                value={
                                  variety.varietyId
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleVarietyChange(
                                    cropIndex,
                                    varietyIndex,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  loading ||
                                  !crop.cropId
                                }
                                required
                              >
                                <option value="">
                                  Select variety
                                </option>

                                {varieties.map(
                                  (
                                    item
                                  ) => (
                                    <option
                                      key={
                                        item.id
                                      }
                                      value={
                                        item.id
                                      }
                                    >
                                      {
                                        item.name
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">
                                Quantity (kg)
                              </label>

                              <input
                                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={
                                  variety.quantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleQuantityChange(
                                    cropIndex,
                                    varietyIndex,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="e.g. 500"
                                disabled={
                                  loading
                                }
                                required
                              />
                            </div>

                            {/* Remove variety */}
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-700 p-2"
                              onClick={() =>
                                removeVariety(
                                  cropIndex,
                                  varietyIndex
                                )
                              }
                              disabled={
                                loading
                              }
                              title="Remove variety"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}

                      {crop.cropId &&
                        crop.varieties
                          .length > 0 && (
                          <button
                            type="button"
                            className="w-full border border-dashed rounded-lg py-2 text-sm text-primary hover:bg-white"
                            onClick={() =>
                              addVariety(
                                cropIndex
                              )
                            }
                            disabled={
                              loading
                            }
                          >
                            <Plus className="w-4 h-4 inline mr-1" />
                            Add another variety
                          </button>
                        )}
                    </div>
                  </div>
                );
              }
            )}

            {/* Total */}
            {form.crops.length > 0 && (
              <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-700">
                  Total requested quantity
                </span>

                <span className="font-semibold text-gray-900">
                  {totalQuantity.toLocaleString()}{' '}
                  kg
                </span>
              </div>
            )}
          </div>

          {/* Requested date + seed class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 block mb-1">
                Requested date
              </label>

              <input
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                type="date"
                value={
                  form.requestedDate
                }
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    requestedDate:
                      event.target
                        .value,
                  }))
                }
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">
                Seed class
              </label>

              <select
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                value={form.seedClass}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    seedClass:
                      event.target
                        .value,
                  }))
                }
                disabled={loading}
              >
                <option value="">
                  Select seed class
                </option>

                <option value="certified">
                  Certified
                </option>

                <option value="quality_declared">
                  Quality Declared
                </option>

                <option value="basic">
                  Basic
                </option>

                <option value="pre_basic">
                  Pre-basic
                </option>
              </select>
            </div>
          </div>

          {/* Pickup location */}
          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Pickup location
            </label>

            <input
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
              type="text"
              value={
                form.pickup_location
              }
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  pickup_location:
                    event.target
                      .value,
                }))
              }
              placeholder="Where seed will be picked"
              disabled={loading}
            />
          </div>

          {/* Status */}
          {isEdit && (
            <div>
              <label className="text-sm text-gray-700 block mb-1">
                Status
              </label>

              <select
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status:
                      event.target
                        .value,
                  }))
                }
                disabled={loading}
              >
                <option value="pending">
                  Pending
                </option>

                <option value="accepted">
                  Accepted
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="completed">
                  Completed
                </option>
              </select>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Comment{' '}
              {!isEdit &&
                '(optional)'}
            </label>

            <textarea
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
              rows={3}
              value={form.comment}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  comment:
                    event.target
                      .value,
                }))
              }
              placeholder="Add notes for your pre-order request"
              disabled={loading}
            />
          </div>

          {isEdit && (
            <div className="text-xs text-gray-500 bg-gray-50 border rounded-lg p-3">
              You can update the crops,
              varieties, quantities and
              other request details for this
              pre-order.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                loading ||
                form.crops.length === 0
              }
            >
              {loading
                ? 'Saving...'
                : isEdit
                  ? 'Save changes'
                  : 'Submit pre-order'}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PreOrderFormSheet;