// frontend/src/components/admin/AdminLayout.jsx
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";

function OutletFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
      Loading…
    </div>
  );
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#070b16] text-white md:flex">
      {/* Sidebar — becomes sticky on md+ */}
      <div className="md:sticky md:top-0 md:h-screen md:overflow-y-auto md:shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto w-full max-w-7xl">
          {/* Lazy admin pages resolve here — sidebar stays mounted during load */}
          <Suspense fallback={<OutletFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}