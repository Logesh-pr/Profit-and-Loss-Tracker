import React from "react";

//Router
import { Link } from "react-router-dom";

//images
import Logo from "../assets/logo/logo.png";

//icons
import { RiMenu3Fill } from "react-icons/ri";
import { IoCloseSharp } from "react-icons/io5";

const Navbar = ({ handleNavbar, navbar }) => {
  return (
    <div className=" border-b border-dotted border-gray">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link to={"/"}>
          <img
            src={Logo}
            alt=""
            className="w-[100px] md:w-[140px] xl:w-[160px]"
          />
        </Link>
        <div onClick={handleNavbar}>
          {navbar ? (
            <IoCloseSharp className="text-2xl md:text-2xl cursor-pointer text-gray-400 md:hidden" />
          ) : (
            <RiMenu3Fill className="text-xl md:text-2xl cursor-pointer text-gray-400 md:hidden" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
