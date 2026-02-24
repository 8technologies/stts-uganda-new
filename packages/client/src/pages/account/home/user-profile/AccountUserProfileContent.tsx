import { ProfileOverviewCard } from "./blocks";
import { AccountDetailsEditor } from "./blocks/AccountDetailsEditor";

const AccountUserProfileContent = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="xl:col-span-2">
        <AccountDetailsEditor />
      </div>
      <div className="xl:col-span-1">
        <ProfileOverviewCard />
      </div>
    </div>
  );
};

export { AccountUserProfileContent };
