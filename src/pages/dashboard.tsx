import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import AppHeader from "../components/AppHeader";
import "../styles/dashboard.css";

export default function Dashboard() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return <Navigate to="/" replace />;

  return (
    <div className="dashboard-container">
      {/* Full-width branding banner — no user info, no padding, edge-to-edge */}
      <AppHeader />

      <div className="dashboard-body">
        <Sidebar />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
