import { Link, Outlet } from "react-router-dom";
import { Fragment } from "react";
import { toAbsoluteUrl } from "@/utils";
import useBodyClasses from "@/hooks/useBodyClasses";
import { AuthBrandedLayoutProvider } from "./AuthBrandedLayoutProvider";

const Layout = () => {
  // Applying body classes to manage the background color in dark mode
  useBodyClasses("dark:bg-coal-500");

  return (
    <Fragment>
      <style>
        {`
          .branded-bg {
            background-image: linear-gradient(135deg, rgba(65, 61, 63, 0.99), rgba(65, 61, 63, 0.0)), url('https://seedtracking.net/assets/images/bg/background2.jpg');
            background-size: cover;
            background-blend-mode: multiply;
          }
          .dark .branded-bg {
            background-image: linear-gradient(135deg, rgba(23,96,45,0.95), rgba(40,184,98,0.9)), url('https://seedtracking.net/assets/images/bg/background2.jpg');
            background-size: cover;
            background-blend-mode: multiply;
          }
        `}
      </style>

      <div className="grid lg:grid-cols-2 grow lg:min-h-screen lg:h-screen lg:overflow-hidden">
        <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-1 lg:h-full lg:overflow-y-auto">
          <Outlet />
        </div>

        <div className="lg:rounded-xl lg:border lg:border-gray-200 lg:m-5 order-1 lg:order-2 bg-top xxl:bg-center xl:bg-cover bg-no-repeat branded-bg ">
          <div className="flex flex-col p-8 lg:p-16 gap-4">
            <Link to="/">
              {/* <img
                src={`https://seedtracking.net/assets/images/maaif.png`}
                className="h-[64px] max-w-none"
                alt="STTS"
              /> */}
            </Link>

            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-semibold text-white">
                Seed Tracking & Tracing System
              </h3>
              <div className="text-base font-medium text-white/90">
                Ensure authenticity, quality, and transparency across the seed
                value chain.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

// AuthBrandedLayout component that wraps the Layout component with AuthBrandedLayoutProvider
const AuthBrandedLayout = () => (
  <AuthBrandedLayoutProvider>
    <Layout />
  </AuthBrandedLayoutProvider>
);

export { AuthBrandedLayout };
