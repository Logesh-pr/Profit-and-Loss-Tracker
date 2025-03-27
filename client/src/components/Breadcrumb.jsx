import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchProjectDetails } from "../config/fetch";

const Breadcrumb = () => {
  const location = useLocation();
  const { pathname } = location;
  const params = useParams();
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    // If we're on a project detail page, fetch the project name
    if (pathname.match(/^\/projects\/[^/]+$/)) {
      const projectId = pathname.split("/").pop();
      fetchProjectDetails(projectId)
        .then((response) => {
          if (response.data && response.data.name) {
            setProjectName(response.data.name);
          }
        })
        .catch((error) => {
          console.error("Error fetching project details:", error);
        });
    }
  }, [pathname]);

  const getPathItems = () => {
    const pathParts = pathname.split("/").filter(Boolean);

    if (pathParts.length === 0) {
      return [
        { name: "Dashboards", path: "/" },
        { name: "Overview", path: "/" },
      ];
    }

    const items = [{ name: "Dashboards", path: "/" }];

    // Handle specific routes
    if (pathParts[0] === "projects") {
      items.push({ name: "Projects", path: "/projects" });

      // If we're on a project detail page
      if (pathParts.length > 1) {
        items.push({
          name: projectName || "Project Details",
          path: pathname,
        });
      }
    } else {
      let currentPageName = pathParts[pathParts.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      items.push({ name: currentPageName, path: pathname });
    }

    return items;
  };

  const breadcrumbItems = getPathItems();

  return (
    <div className="flex items-center text-sm text-gray-400">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="mx-2">/</span>}
            {isLast ? (
              <span className="text-white font-medium ">{item.name}</span>
            ) : (
              <Link to={item.path} className="hover:text-gray-300">
                {item.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
