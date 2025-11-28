/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { LOAD_SEED_LABS } from '@/gql/queries';
import { SUBMIT_LAB_INSPECTION } from '@/gql/mutations'; // <-- define this in your schema if different

import { useAuthContext } from '@/auth';
import { Checkbox } from '@/components/ui/checkbox';

type SeedLabInspection = {
  id: string;
  collection_date: string | null;
  inspector_id: string | null;
  status: string | null;
  stock_examination_id: string | null;
  variety_id: string | null;
  variety?: { name?: string | null } | null;
  inspector?: { username?: string | null; name?: string | null } | null;
  createdBy?: { username?: string | null } | null;
  inspector_report?: any | null;
};

const parseJSON = (x: any) => {
  try {
    return typeof x === 'string' ? JSON.parse(x) : x;
  } catch {
    return null;
  }
};

const toISODate = (d: string | Date) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
};

const isNum = (v: any) => v !== '' && v !== null && !Number.isNaN(Number(v));

const SeedLabInspectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();

  const { data, loading, error, refetch } = useQuery(LOAD_SEED_LABS, {
    fetchPolicy: 'cache-and-network',
  });

  const [saveInspection, { loading: saving }] = useMutation(SUBMIT_LAB_INSPECTION, {
    refetchQueries: [{ query: LOAD_SEED_LABS }],
    awaitRefetchQueries: true,
  });

  // pick the record by id
  const record: SeedLabInspection | undefined = useMemo(() => {
    const list: SeedLabInspection[] = (data?.getLabInspections || []) as any[];
    return list.find((r) => String(r.id) === String(id));
  }, [data, id]);

  // hydrate form from existing report if any
  const existingReport = useMemo(() => parseJSON(record?.inspector_report) || {}, [record?.inspector_report]);

  const [samplingDate, setSamplingDate] = useState<string>('');
  const [sampleWeightKg, setSampleWeightKg] = useState<string>('');
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [packaging, setPackaging] = useState<string>('');
  const [motherLot, setMotherLot] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('');
  const [sampleCondition, setSampleCondition] = useState<string>('');
  const [testsRequired, setTestsRequired] = useState<string>('');
  const [decision, setDecision] = useState<'accept' | 'reject' | ''>('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const toggleValue = (value: string) => {
    setSelectedTests((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  console.log('testsRequired:', record);
  console.log('selectedTests:', selectedTests);

  // Optional cap for quantity (e.g., current 'In Stock' balance). If you have it, set here.
  const MAX_QTY_HINT = existingReport?.meta?.max_stock_kg || 2000; // change/remove if you fetch real balance

 /*  useEffect(() => {
    if (!record) return;
    const rep = existingReport?.sample || {};
    setSamplingDate(toISODate(record.collection_date || rep.sampling_date || new Date()));
    setSampleWeightKg(rep.sample_weight_kg?.toString?.() || '');
    setQuantityKg(rep.quantity_represented_kg?.toString?.() || '');
    setPackaging(rep.packaging || '');
    setMotherLot(rep.mother_lot || '');
    setLotNumber(rep.lot_number || '');
    setSampleCondition(rep.sample_condition || '');
    setTestsRequired(
      Array.isArray(rep.tests_required) ? rep.tests_required.join(', ') : (rep.tests_required || '')
    );
    setDecision(
      record.status?.toLowerCase() === 'accepted'
        ? 'accept'
        : record.status?.toLowerCase() === 'rejected'
          ? 'reject'
          : ''
    );
  }, [record]);  */

  const valid =
    samplingDate &&
    isNum(sampleWeightKg) &&
    Number(sampleWeightKg) > 0 &&
    isNum(quantityKg) &&
    Number(quantityKg) > 0 &&
    sampleCondition &&
    selectedTests; // decision validated only for Submit

  const handleSave = async (finalize = false) => {
    if (!record?.id) return;

    if (!valid || (finalize && !decision)) {
      toast.error('Please fill all required fields' + (finalize ? ' and choose a decision.' : '.'));
      return;
    }

    /* const testsArray = testsRequired
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean); */

    // Build the JSON to persist in inspector_report
    const inspectorReport = {
      // sample: {
        sampling_date: samplingDate,
        sample_weight_kg: Number(sampleWeightKg),
        quantity_represented_kg: Number(quantityKg),
        packaging,
        mother_lot: motherLot || null,
        lot_number: lotNumber || null,
        sample_condition: sampleCondition,
        tests_required: selectedTests,
      // },
      
    };

    const input: any = {
      id: String(record.id),
      // collection_date: samplingDate, // keep top-level field in sync
      inspector_report: inspectorReport,
    };

    if (finalize) {
      input.decision = decision === 'accept' ? 'accepted' : 'rejected';
    }

    console.log('Submitting input:', input);

    try {
      await saveInspection({ variables: { input } });
      toast.success(finalize ? 'Inspection submitted.' : 'Draft saved.');
      if (finalize) navigate(-1);
    } catch (e: any) {
      toast.error('Failed to save inspection', { description: e?.message || 'Unknown error' });
    }
  };

  if (loading && !record) {
    return (
      <Container>
        <div className="card p-6">Loading inspection…</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2 text-red-700">
            Failed to load inspections
            <button className="btn btn-sm" onClick={() => refetch()}>
              <KeenIcon icon="arrow-rotate-right" /> Retry
            </button>
          </div>
          <div className="text-xs text-gray-600">{String(error.message || 'Unknown error')}</div>
        </div>
      </Container>
    );
  }

  if (!record) {
    return (
      <Container>
        <div className="card p-6">Inspection not found.</div>
      </Container>
    );
  }

  const isInspectorAssigned =
    (record.status || '').toLowerCase() === 'inspector_assigned' ||
    (record.status || '').toLowerCase() === 'assigned_inspector';

  const meIsInspector =
    record.inspector_id &&
    currentUser?.id &&
    String(record.inspector_id) === String(currentUser.id);

  const lock = !isInspectorAssigned || !meIsInspector || saving;

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <KeenIcon icon="flask" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-900">Seed Lab Inspection</div>
            <div className="text-sm text-slate-600">
              {record.variety?.name ? `Variety: ${record.variety.name}` : 'Variety: —'} · ID: {record.id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/qa/seed-labs/${record.id}`}>
            <Button variant="outline">
              <KeenIcon icon="arrow-left" /> Back
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || !valid}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <KeenIcon icon="task" /> Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving || !valid || !decision}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <KeenIcon icon="tick-square" /> Submit Decision
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* --- Sampling & quantities --- */}
        <div className="rounded-xl border  bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 mb-4">Sampling & Quantities</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="form-label">
                Sampling date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={samplingDate}
                onChange={(e) => setSamplingDate(e.target.value)}
                disabled={lock}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">
                Enter weight of Sample (Kgs) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="e.g. 5"
                value={sampleWeightKg}
                onChange={(e) => setSampleWeightKg(e.target.value)}
                disabled={lock}
              />
              <small className="text-slate-500">This is the sample weight you're going to test.</small>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="form-label">
                Enter the quantity represented (in Kgs) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                placeholder="e.g. 200"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                disabled={lock}
              />
              <small className="text-emerald-700 font-medium">
                {`This value should not be more than ${MAX_QTY_HINT} (The applicant's current 'In Stock' Balance).`}
              </small>
            </div>
          </div>
        </div>

        {/* --- Packaging & lot details --- */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 mb-4">Packaging & Lot Details</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="form-label">
                Packaging <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Input Packaging"
                value={packaging}
                onChange={(e) => setPackaging(e.target.value)}
                disabled={lock}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">Mother lot</label>
              <Input
                placeholder="Input Mother lot"
                value={motherLot}
                onChange={(e) => setMotherLot(e.target.value)}
                disabled={lock}
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="form-label">Lot Number</label>
              <Input
                placeholder="Optional Lot Number"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                disabled={lock}
              />
            </div>
          </div>
        </div>

        {/* --- Condition & tests --- */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 mb-4">Condition & Tests</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="form-label">
                Sample condition <span className="text-red-500">*</span>
              </label>
              <Select
                value={sampleCondition}
                onValueChange={setSampleCondition}
                disabled={lock}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sample condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processed">Processed seed</SelectItem>
                  <SelectItem value="unprocessed">Unprocessed seed</SelectItem>
                  <SelectItem value="treated">Treated seed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">
                Tests required <span className="text-red-500">*</span>
              </label>
              {/* <Select
                value={sampleCondition}
                onValueChange={(e) => setTestsRequired(e.target.value)}
                disabled={lock}
              >
                <SelectTrigger>
                  <SelectValue placeholder="e.g. Purity, Germination, Moisture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purity">Purity</SelectItem>
                  <SelectItem value="germination">Germination</SelectItem>
                  <SelectItem value="moisture">Moisture</SelectItem>
                  <SelectItem value="health">Seed health</SelectItem>
                </SelectContent>
              </Select> */}
              <Select disabled={false}>
      <SelectTrigger className="w-[280px]">
        <SelectValue
          placeholder="Select tests"
          aria-label="Tests"
        >
          {selectedTests.length > 0
            ? selectedTests.join(", ")
            : "e.g. Purity, Germination, Moisture"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {["purity", "germination", "moisture", "health"].map((item) => (
          <div
            key={item}
            className="flex items-center px-2 py-1.5 space-x-2 cursor-pointer hover:bg-gray-100"
            onClick={() => toggleValue(item)}
          >
            <Checkbox checked={selectedTests.includes(item)} />
            <span className="capitalize">{item}</span>
          </div>
        ))}
      </SelectContent>
    </Select>
              {/* <Input
                placeholder="e.g. Purity, Germination, Moisture"
                value={testsRequired}
                onChange={(e) => setTestsRequired(e.target.value)}
                disabled={lock}
              /> */}
              {/* <small className="text-slate-500">Comma-separated list will be saved as an array.</small> */}
            </div>
          </div>
        </div>

        {/* --- Decision --- */}
        <div className="rounded-xl border  bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900 mb-4">Decision</div>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="decision"
                className="text-emerald-600"
                checked={decision === 'accept'}
                onChange={() => setDecision('accept')}
                disabled={lock}
              />
              Accept
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="decision"
                className="text-emerald-600"
                checked={decision === 'reject'}
                onChange={() => setDecision('reject')}
                disabled={lock}
              />
              Reject
            </label>
          </div>

          <div className="mt-3 text-xs text-emerald-700 font-medium">
            NOTE: You cannot reverse this process once it's done.
          </div>
        </div>
      </div>
    </Container>
  );
};

export default SeedLabInspectionPage;
