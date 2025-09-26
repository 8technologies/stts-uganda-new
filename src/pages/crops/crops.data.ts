export type CropInspectionType = {
  stageName: string;
  order: number;
  required: boolean;
  periodAfterPlantingDays: number;
};

export type CropVariety = { name: string };

export type Crop = {
  id: string; // slug/id used in routes
  name: string;
  isQDS: boolean;
  daysBeforeSubmission: number;
  units: string; // display units
  varieties: CropVariety[];
  inspectionTypes: CropInspectionType[];
  createdAt?: string;
};

// Dummy crops dataset to power listings & details
export const CROPS_MOCK: Crop[] = [
  {
    id: 'maize',
    name: 'Maize',
    isQDS: true,
    daysBeforeSubmission: 14,
    units: 'Kg',
    varieties: [{ name: 'Longe 5' }, { name: 'Longe 10H' }],
    inspectionTypes: [
      { stageName: 'Pre-planting', order: 1, required: true, periodAfterPlantingDays: 0 },
      { stageName: 'Vegetative', order: 2, required: true, periodAfterPlantingDays: 30 },
      { stageName: 'Flowering', order: 3, required: true, periodAfterPlantingDays: 60 }
    ],
    createdAt: '2024-04-12T10:00:00Z'
  },
  {
    id: 'beans',
    name: 'Beans',
    isQDS: false,
    daysBeforeSubmission: 7,
    units: 'Bags',
    varieties: [{ name: 'NABE 17' }, { name: 'NABE 4' }],
    inspectionTypes: [
      { stageName: 'Pre-planting', order: 1, required: true, periodAfterPlantingDays: 0 },
      { stageName: 'Flowering', order: 2, required: false, periodAfterPlantingDays: 45 },
      { stageName: 'Maturity', order: 3, required: true, periodAfterPlantingDays: 90 }
    ],
    createdAt: '2024-06-05T09:30:00Z'
  },
  {
    id: 'rice',
    name: 'Rice',
    isQDS: true,
    daysBeforeSubmission: 10,
    units: 'Tonnes',
    varieties: [{ name: 'Nerica 1' }, { name: 'Nerica 4' }, { name: 'Supa' }],
    inspectionTypes: [
      { stageName: 'Pre-planting', order: 1, required: true, periodAfterPlantingDays: 0 },
      { stageName: 'Tillering', order: 2, required: true, periodAfterPlantingDays: 40 },
      { stageName: 'Panicle initiation', order: 3, required: true, periodAfterPlantingDays: 70 }
    ],
    createdAt: '2024-03-21T14:15:00Z'
  }
];

export const findCropById = (id: string) => CROPS_MOCK.find((c) => String(c.id) === String(id));

