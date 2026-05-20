import { Container } from "@/components/container";
import { Toolbar, ToolbarHeading } from "@/layouts/demo1/toolbar";
import { KeenIcon } from "@/components/keenicons";
import { ModalSearch } from "@/partials/modals/search/ModalSearch";
import { useEffect, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { TRACK_TRACE } from "@/gql/queries";

const TrackTracePage = () => {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [track, setTrack] = useState(false);
  const [lotNumber, setLotNumber] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>();
  const [isTracking, setIsTracking] = useState(false);
  const [data, setData] = useState<any>(null);

  const [fetchTrackTrace] = useLazyQuery(TRACK_TRACE, {
    fetchPolicy: "network-only",
  });

  const handleTrackTrace = async (isTrack: boolean) => {
    setTrack(isTrack);
    setSearchModalOpen(true);
    setIsTracking(true);
    const result = await fetchTrackTrace({ variables: { lotNumber: String(lotNumber) } });
    setData(result.data ?? null);
    setIsTracking(false);
  };
     
  const stopScanner = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isScanning) {
      stopScanner();
      return;
    }

    const BarcodeDetector = (window as any)?.BarcodeDetector;
    

    if (!BarcodeDetector) {
      console.error("BarcodeDetector API not supported,");
      setScanError("QR scanning is not supported in this browser.");
      return;
    }

    const startScanner = async () => {
      setScanError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        const detect = async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length && barcodes[0]?.rawValue) {
              const raw = barcodes[0].rawValue.trim();
              window.location.assign(raw);
              stopScanner();
              return;
            }
          } catch (err) {
            console.error("Scanner detection error", err);
          }
          rafRef.current = requestAnimationFrame(detect);
        };
        detect();
      } catch (err) {
        console.error("Unable to access camera", err);
        setScanError("Unable to access camera. Please allow camera permissions.");
        stopScanner();
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isScanning]);
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="Track and Trace"
            description="Verify seed lots by number"
          />
        </Toolbar>
      </Container>
      <Container>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Please enter a lot number</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 w-full">
              <label className="input grow max-w-2xl">
                <KeenIcon icon="hash" />
                <input
                  className="form-control"
                  placeholder="Enter lot number"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                />
                <button
                  className="btn btn-sm btn-primary"
                  type="button"
                  onClick={() => setIsScanning(true)}
                >
                  Scan QR Code
                </button>
              </label>
              <button
                className="btn btn-success"
                onClick={() => handleTrackTrace(true)}
              >
                {isTracking ? "Tracking..." : "Track"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleTrackTrace(false)}
              >
                {isTracking ? "Tracing..." : "Trace"}
              </button>
            </div>
          </div>
        </div>
      </Container>

      {/* {!lotNumber && ( */}
      <ModalSearch
        open={searchModalOpen}
        onOpenChange={() => setSearchModalOpen(false)}
        track={track}
        data={data}
        lotNumber={lotNumber}
      />
      {/* )} */}
       

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white/5 p-4 text-center text-white">
            <video
              ref={videoRef}
              className="w-full rounded-2xl border-4 border-white"
              playsInline
              muted
            />
            {scanError && (
              <p className="mt-3 text-sm text-red-200">{scanError}</p>
            )}
            <button
              type="button"
              className="btn btn-light mt-4"
              onClick={() => setIsScanning(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export { TrackTracePage };
