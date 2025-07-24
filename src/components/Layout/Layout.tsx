import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "../../lib/store";
import { cn } from "../../lib/utils";

export const Layout: React.FC = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => useUIStore.getState().toggleSidebar()}
        >
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Fixed Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content with left margin for sidebar */}
      <div className="md:ml-64">
        <div className="flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
            <div className="w-[80vw] min-h-[80vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
              <div className="w-full">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
