import React, { forwardRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useDemo1Layout } from '../';
import { toAbsoluteUrl } from '@/utils';
import { SidebarToggle } from './';

const SidebarHeader = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { layout } = useDemo1Layout();

  const lightLogo = () => (
    <Fragment>
      <Link to="/" className="dark:hidden">
        <div
          style={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <img
            src={`https://seedtracker.net/assets/images/maaif.png`}
            className="default-logo min-h-[2px] max-w-none w-12"
            style={{
              borderRadius: 25
            }}
          />
          <h2
            className="default-logo ml-2"
            style={{
              fontSize: 20,
              fontWeight: 'bold'
              // color: '#fff'
            }}
          >
            STTS
          </h2>
        </div>
        <img
          src={`https://seedtracker.net/assets/images/maaif.png`}
          className="small-logo min-h-[22px] max-w-none w-8"
          style={{
            borderRadius: 25
          }}
        />
      </Link>
      <Link to="/" className="hidden dark:block">
        <img
          src={toAbsoluteUrl('/media/app/stts-logo.svg')}
          className="default-logo min-h-[22px] max-w-none"
        />
        <img
          src={toAbsoluteUrl('/media/app/stts-mini.svg')}
          className="small-logo min-h-[22px] max-w-none"
        />
      </Link>
    </Fragment>
  );

  const darkLogo = () => (
    <Link to="/">
      <img
        src={toAbsoluteUrl('/media/app/stts-logo.svg')}
        className="default-logo min-h-[22px] max-w-none"
      />
      <img
        src={toAbsoluteUrl('/media/app/stts-mini.svg')}
        className="small-logo min-h-[22px] max-w-none"
      />
    </Link>
  );

  return (
    <div
      ref={ref}
      className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0"
      // style={{
      //   backgroundColor: '#1F7A3A'
      // }}
    >
      {layout.options.sidebar.theme === 'light' ? lightLogo() : darkLogo()}
      <SidebarToggle />
    </div>
  );
});

export { SidebarHeader };
