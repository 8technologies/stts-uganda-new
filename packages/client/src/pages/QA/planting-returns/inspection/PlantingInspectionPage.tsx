import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KeenIcon } from "@/components";
import { Accordion, AccordionItem } from "@/components/accordion";
import { toast } from "sonner";

import {
  LOAD_PLANTING_RETURN,
  LOAD_CROP,
  LOAD_PLANTING_INSPECTION,
} from "@/gql/queries";
import {
  INITIALIZE_PLANTING_INSPECTION,
  SUBMIT_PLANTING_INSPECTION_STAGE,
} from "@/gql/mutations";
import { formatDateTime, formatIsoDate } from "@/utils/Date";

type StageDecision = "rejected" | "provisional" | "skipped" | "accepted";

const badgeClass = (s?: string) => {
  const v = String(s || "pending").toLowerCase();
  const color =
    v === "accepted"
      ? "success"
      : v === "rejected"
        ? "danger"
        : v === "provisional"
          ? "info"
          : v === "skipped"
            ? "gray"
            : "warning";
  return `badge badge-${color} shrink-0 badge-outline rounded-[30px]`;
};

const PlantingInspectionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const pid = String(id || "");

  const { data: detail, loading: loadingDetail } = useQuery(
    LOAD_PLANTING_RETURN,
    {
      variables: { id: pid },
      skip: !pid,
    },
  );
  const planting = detail?.plantingReturn;

  const cropId = planting?.crop?.id || planting?.cropId;
  const { data: cropData } = useQuery(LOAD_CROP, {
    variables: { id: String(cropId || "") },
    skip: !cropId,
  });
  const crop = cropData?.crop;
  const stagesFromCrop = (crop?.inspectionTypes || [])
    .slice()
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const {
    data: insp,
    loading: inspLoading,
    refetch: refetchInsp,
  } = useQuery(LOAD_PLANTING_INSPECTION, {
    variables: { id: pid },
    skip: !pid,
  });
  const tasks = insp?.plantingReturnInspection?.stages || [];

  const [initialize, { loading: initializing }] = useMutation(
    INITIALIZE_PLANTING_INSPECTION,
    {
      refetchQueries: [
        { query: LOAD_PLANTING_INSPECTION, variables: { id: pid } },
        { query: LOAD_PLANTING_RETURN, variables: { id: pid } },
      ],
      awaitRefetchQueries: true,
    },
  );

  const [submitStage, { loading: submitting }] = useMutation(
    SUBMIT_PLANTING_INSPECTION_STAGE,
    {
      refetchQueries: [
        { query: LOAD_PLANTING_INSPECTION, variables: { id: pid } },
        { query: LOAD_PLANTING_RETURN, variables: { id: pid } },
      ],
      awaitRefetchQueries: true,
    },
  );

  const stageStatusMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const t of tasks) {
      const key = String(t.inspectionTypeId || t.id);
      m[key] = t;
    }
    return m;
  }, [tasks]);

  const firstPendingOrder = useMemo(() => {
    for (const s of stagesFromCrop) {
      const existing = stageStatusMap[String(s.id)];
      const status = String(existing?.status || "pending").toLowerCase();
      console.log("Stage", s.order, status);
      console.log("existing", existing);
      if (!existing || status === "pending" || status === "provisional")
        return s.order;
    }
    return Infinity;
  }, [stagesFromCrop, stageStatusMap]);

  const handleInitialize = async () => {
    try {
      const res = await initialize({
        variables: { input: { plantingReturnId: pid } },
      });
      const ok = res?.data?.initializePlantingReturnInspection?.success;
      if (!ok)
        throw new Error(
          res?.data?.initializePlantingReturnInspection?.message ||
            "Failed to initialize",
        );
      toast("Inspection initialized");
    } catch (e: any) {
      toast("Failed to initialize", {
        description: e?.message || "Unknown error",
      });
    }
  };

  const canInitialize = !tasks || tasks.length === 0;

  return (
    <Container>
      <div className="card">
        <div className="card-header border-b-0">
          <div className="flex items-center gap-3">
            <Button variant="light" onClick={() => navigate(-1)}>
              <KeenIcon icon="arrow-left" /> Back
            </Button>
            <h3 className="card-title">SR10 – Field Inspection</h3>
          </div>
        </div>
        <div className="card-body space-y-6">
          {/* Summary */}
          <div className="p-4 rounded-lg border bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">SR8 Number</div>
                <div className="font-medium text-gray-900">
                  {planting?.sr8Number || "—"}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Grower</div>
                <div className="font-medium text-gray-900">
                  {planting?.applicantName || "—"}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Crop / Variety</div>
                <div className="font-medium text-gray-900">
                  {planting?.crop?.name || "—"}
                  {planting?.variety?.name
                    ? ` – ${planting?.variety?.name}`
                    : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Initialize */}
          {canInitialize && (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
              <div className="text-sm text-gray-700">
                No inspection stages yet. Initialize to create stage checklist.
              </div>
              <Button
                onClick={handleInitialize}
                disabled={initializing || inspLoading}
              >
                <KeenIcon icon="play" />{" "}
                {initializing ? "Initializing…" : "Initialize Inspection"}
              </Button>
            </div>
          )}

          {/* Stages */}
          <div className="p-0 rounded-lg border bg-white">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-800">Progress Stages</h3>
            </div>
            <div className="px-2">
              <Accordion allowMultiple={false}>
                {stagesFromCrop.map((s: any, idx: number) => {
                  const existing = stageStatusMap[String(s.id)];
                  const isLast = idx === stagesFromCrop.length - 1;
                  const status = existing?.status || "pending";
                  const edit = status === "submitted";
                  const enabled =  !canInitialize && s.order <= firstPendingOrder && !edit;
                  const due = existing?.dueDate
                    ? formatIsoDate(existing.dueDate)
                    : "—";
                  
                  console.log("edit", status, edit);
                  return (
                    <AccordionItem
                      key={s.id}
                      title={
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <span
                              className={`size-5 rounded-full ${enabled ? "bg-success" : "bg-gray-300"}`}
                            ></span>
                            <div className="font-medium text-gray-900">
                              {s.stageName}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              style={{
                                marginLeft: 5,
                              }}
                              className={badgeClass(status)}
                            >
                              {String(status)}
                            </span>
                            <span className="text-xs text-gray-600">
                              Due: {due}
                            </span>
                          </div>
                        </div>
                      }
                    >
                      <StageForm
                        enabled={enabled}
                        isLast={isLast}
                        planting={planting}
                        crop={crop}
                        stage={s}
                        task={existing}
                        onSubmit={async (payload) => {
                          try {
                            const res = await submitStage({
                              variables: {
                                input: {
                                  taskId: String(existing?.id || s.id),
                                  inspectionTypeId: String(s.id),
                                  plantingReturnId: pid,
                                  decision: payload.decision,
                                  comment: payload.comment || null,
                                  inputs: payload.inputs,
                                },
                              },
                            });
                            const ok =
                              res?.data?.submitPlantingInspectionStage?.success;
                            if (!ok)
                              throw new Error(
                                res?.data?.submitPlantingInspectionStage
                                  ?.message || "Failed to submit stage",
                              );
                            toast("Stage submitted");
                            await refetchInsp?.();
                          } catch (e: any) {
                            toast("Failed to submit stage", {
                              description: e?.message || "Unknown error",
                            });
                          }
                        }}
                      />
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

const StageForm = ({
  enabled,
  isLast,
  planting,
  crop,
  stage,
  task,
  onSubmit,
}: {
  enabled: boolean;
  isLast: boolean;
  planting: any;
  crop: any;
  stage: any;
  task: any;
  onSubmit: (payload: {
    decision: StageDecision;
    comment?: string;
    inputs: any;
  }) => Promise<void>;
}) => {
  const [values, setValues] = useState<any>({
    gpsLat: planting?.location?.gpsLat || "",
    gpsLng: planting?.location?.gpsLng || "",
    seedClass: planting?.seedClass || "",
    fieldSize: planting?.areaHa || "",
    offTypes: "",
    diseases: "",
    noxiousWeeds: "",
    otherFeatures: "",
    otherWeeds: "",
    isolationMode: "distance",
    isolationDistance: "",
    plantCount: "",
    generalCondition: "",
    estimatedYield: "",
    remarks: "",
  });
  const [decision, setDecision] = useState<StageDecision>(
    isLast ? "accepted" : "provisional",
  );
  const [comment, setComment] = useState("");

  useEffect(() => {
    // If task has previous inputs, prefill
    if (task?.inputs) {
      try {
        const prev =
          typeof task.inputs === "string"
            ? JSON.parse(task.inputs)
            : task.inputs;
        setValues((v: any) => ({ ...v, ...prev }));
      } catch {}
    }
  }, [task?.inputs]);

  const handleGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValues((v: any) => ({
          ...v,
          gpsLat: String(pos.coords.latitude),
          gpsLng: String(pos.coords.longitude),
        }));
      },
      () => {},
    );
  };

  const canPrint =
    String(task?.status || "").toLowerCase() !== "pending" && !!task;

  const handlePrint = () => {
    try {
      const win = window.open("", "_blank");
      if (!win) return;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Inspection Report</title></head><body>
        <h2>Inspection Report – ${stage?.stageName || ""}</h2>
        <p><strong>SR8:</strong> ${planting?.sr8Number || "—"}</p>
        <p><strong>Grower:</strong> ${planting?.applicantName || "—"}</p>
        <p><strong>Crop/Variety:</strong> ${(planting?.crop?.name || "—") + (planting?.variety?.name ? " – " + planting?.variety?.name : "")}</p>
        <hr />
        <pre style="font-family: ui-monospace; white-space: pre-wrap">${JSON.stringify(values, null, 2)}</pre>
        <p><strong>Decision:</strong> ${decision}</p>
        <p><strong>Comment:</strong> ${comment || "—"}</p>
        <script>window.addEventListener('load', () => setTimeout(() => { window.print(); window.close(); }, 200));</script>
      </body></html>`;
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch {}
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Your Current GPS latitude</label>
          <div className="flex gap-2">
            <Input
              value={values.gpsLat}
              onChange={(e) => setValues({ ...values, gpsLat: e.target.value })}
              readOnly={!enabled}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGeo}
              disabled={enabled}
            >
              Get GPS
            </Button>
          </div>
        </div>
        <div>
          <label className="form-label">Your Current GPS longitude</label>
          <Input
            value={values.gpsLng}
            onChange={(e) => setValues({ ...values, gpsLng: e.target.value })}
            readOnly={!enabled}
          />
        </div>
        <div>
          <label className="form-label">Seed class</label>
          <Input
            value={values.seedClass}
            onChange={(e) =>
              setValues({ ...values, seedClass: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Enter size of field (ha)</label>
          <Input
            value={values.fieldSize}
            onChange={(e) =>
              setValues({ ...values, fieldSize: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Off-types</label>
          <Input
            value={values.offTypes}
            onChange={(e) => setValues({ ...values, offTypes: e.target.value })}
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Diseases</label>
          <Input
            value={values.diseases}
            onChange={(e) => setValues({ ...values, diseases: e.target.value })}
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Noxious weeds</label>
          <Input
            value={values.noxiousWeeds}
            onChange={(e) =>
              setValues({ ...values, noxiousWeeds: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Other features</label>
          <Input
            value={values.otherFeatures}
            onChange={(e) =>
              setValues({ ...values, otherFeatures: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Other weeds</label>
          <Input
            value={values.otherWeeds}
            onChange={(e) =>
              setValues({ ...values, otherWeeds: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Isolation Distance (m)</label>
          <Input
            value={values.isolationDistance}
            onChange={(e) =>
              setValues({ ...values, isolationDistance: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Plant Count</label>
          <Input
            value={values.plantCount}
            onChange={(e) =>
              setValues({ ...values, plantCount: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">General conditions of crop</label>
          <Textarea
            rows={3}
            value={values.generalCondition}
            onChange={(e) =>
              setValues({ ...values, generalCondition: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div>
          <label className="form-label">Estimated yield (Kg)</label>
          <Input
            value={values.estimatedYield}
            onChange={(e) =>
              setValues({ ...values, estimatedYield: e.target.value })
            }
            readOnly={enabled}
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Any further remarks</label>
          <Textarea
            rows={3}
            value={values.remarks}
            onChange={(e) => setValues({ ...values, remarks: e.target.value })}
            readOnly={enabled}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div className="text-sm font-medium text-gray-800">
          Inspection decision
        </div>
        {!isLast && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={decision === "provisional"}
                onChange={() => setDecision("provisional")}
                disabled={enabled}
              />
              Provisional
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={decision === "skipped"}
                onChange={() => setDecision("skipped")}
                disabled={enabled}
              />
              Skip
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={decision === "rejected"}
                onChange={() => setDecision("rejected")}
                disabled={enabled}
              />
              Reject
            </label>
          </div>
        )}
        {isLast && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={decision === "accepted"}
                onChange={() => setDecision("accepted")}
                disabled={enabled}
              />
              Accepted
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={decision === "rejected"}
                onChange={() => setDecision("rejected")}
                disabled={enabled}
              />
              Rejected
            </label>
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="form-label">Comment</label>
        <Textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          readOnly={enabled}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-gray-600">
          {task?.submittedAt
            ? `Submitted: ${formatDateTime(task.submittedAt)}`
            : "Not submitted"}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="light" onClick={handlePrint} disabled={!canPrint}>
            <KeenIcon icon="printer" /> Print Report
          </Button>
          <Button
            onClick={() => onSubmit({ decision, comment, inputs: values })}
            disabled={ enabled}
          >
            <KeenIcon icon="tick-square" /> Submit Stage
          </Button>
        </div>
      </div>
    </div>
  );
};

export { PlantingInspectionPage };
