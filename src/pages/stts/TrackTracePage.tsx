import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/layouts/demo1/toolbar';
import { KeenIcon } from '@/components/keenicons';

const TrackTracePage = () => {
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading title="Track and Trace" description="Verify seed lots by number" />
        </Toolbar>
      </Container>
      <Container>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Please enter a lot number</h3></div>
          <div className="card-body">
            <div className="flex items-center gap-2 w-full">
              <label className="input grow max-w-2xl">
                <KeenIcon icon="hash" />
                <input className="form-control" placeholder="Enter lot number" />
                <button className="btn btn-sm btn-primary">Scan QR Code</button>
              </label>
              <button className="btn btn-success">Track</button>
              <button className="btn btn-primary">Trace</button>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export { TrackTracePage };

