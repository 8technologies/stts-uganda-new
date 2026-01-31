import { Fragment } from "react";
import { Container } from "@/components/container";
import { Link } from "react-router-dom";
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from "@/partials/toolbar";
import { PageNavbar } from "@/pages/account";

import { AccountUserProfileContent } from ".";
import { useLayout } from "@/providers";

const AccountUserProfilePage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      <PageNavbar />

      {currentLayout?.name === "demo1-layout" && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Manage your profile details and contact information
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Link to="/account/security/overview" className="btn btn-sm btn-light">
                Security
              </Link>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <AccountUserProfileContent />
      </Container>
    </Fragment>
  );
};

export { AccountUserProfilePage };
