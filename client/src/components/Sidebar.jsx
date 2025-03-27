// Sidebar.jsx
import React from "react";

//react router
import { Link, useLocation } from "react-router-dom";

//react icons
import { TfiViewGrid } from "react-icons/tfi";
import { RiFolderAddLine } from "react-icons/ri";

const Sidebar = ({ navbar, setNavbar }) => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <>
      {/* Overlay - only visible on mobile when sidebar is open */}
      {/* {navbar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity- z-10"
          onClick={() => setNavbar(false)}
        />
      )} */}

      <div
        className={`
          fixed md:static
          z-20
         md:top-[90px]
          ${navbar ? "left-0" : "-left-full"}
          md:left-0
          transition-all duration-300 ease-in-out
          w-[70%] md:w-full 
          h-[100vh]
          border-r border-dotted border-gray py-6 px-4 bg-black
        `}
      >
        <div className="text-zinc-300">
          <ul className="flex flex-col gap-y-4">
            <li>
              <Link
                to="/"
                className={`flex items-center gap-x-4 p-2 rounded-xl px-6  
                  ${
                    pathname === "/"
                      ? "bg-white text-black "
                      : "hover:bg-zinc-900"
                  }`}
              >
                <span>
                  <TfiViewGrid />
                </span>
                <p>Overview</p>
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                className={`flex items-center gap-x-4 p-2 rounded-xl px-6 
                  ${
                    pathname.includes("/projects")
                      ? "bg-white text-black"
                      : "hover:bg-zinc-900"
                  }`}
              >
                <span>
                  <RiFolderAddLine />
                </span>{" "}
                <p>Projects</p>
              </Link>
            </li>
            {/* <li>
              <Link className="flex items-center gap-x-4">
                <span>
                  <TfiViewGrid />
                </span>{" "}
                <p>Overview</p>
              </Link>
            </li> */}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
