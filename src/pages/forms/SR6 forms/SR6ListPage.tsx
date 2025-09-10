import { Fragment, useState } from 'react';

import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';

import { NetworkUserTableTeamCrewContent } from './NetworkUserTableTeamCrewContent';
import { useLayout } from '@/providers';
import { SR6CreateDialog } from './blocks/SR6CreateDialog';

const SR6ListPage = () => {
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                <div className="flex items-center flex-wrap gap-1.5 font-medium">
                  <span className="text-md text-gray-700">All Members:</span>
                  <span className="text-md text-gray-800 font-medium me-2">49,053</span>
                  <span className="text-md text-gray-700">Pro Licenses</span>
                  <span className="text-md text-gray-800 font-medium">724</span>
                </div>
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <a href="#" className="btn btn-sm btn-light">
                Import CSV
              </a>
              <a href="#" onClick={() => {setCreateOpen(true); }} className="btn btn-sm btn-primary">
                Add Member
              </a>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <NetworkUserTableTeamCrewContent />
      </Container>
    </Fragment>
    <SR6CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        // data={selected || undefined}
        onSave={(vals) => console.log('Save edit', {vals })}
    />
    </>
  );
};

export { SR6ListPage };
