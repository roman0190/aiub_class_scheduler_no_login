"use client";
import React, { ReactNode, useEffect, useState } from "react";
import localForage from "localforage";
import { usePathname, useRouter } from "next/navigation";

const RouteWrapper = ({ children }: { children: ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        try {
          const isAuth = await localForage.getItem("isAuthenticated");
          const authStatus = isAuth === "true";
          setIsAuthenticated(authStatus);

          // Public pages that don't require authentication
          const isPublicPage = pathname === "/" || pathname === "/terms";

          if (!authStatus && !isPublicPage) {
            // Not authenticated and trying to access protected route
            router.replace("/");
            return;
          }

          if (authStatus && pathname === "/") {
            // Already authenticated but on login page
            router.replace("/aiub");
            return;
          }
        } catch (error) {
          console.error("Authentication check error:", error);
          if (pathname !== "/" && pathname !== "/terms") {
            router.replace("/");
          }
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isChecking) {
    return null;
  }

  // Only render content if:
  // 1. It's a public page (login or terms)
  // 2. User is authenticated (for all other pages)
  const shouldRenderContent =
    pathname === "/" || pathname === "/terms" || isAuthenticated;

  if (!shouldRenderContent) {
    // Safety check - shouldn't reach here because of the redirect, but just in case
    return null;
  }

  return <>{children}</>;
};

export default RouteWrapper;
