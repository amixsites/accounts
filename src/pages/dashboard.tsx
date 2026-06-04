import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { Outlet } from "react-router-dom";

import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <Header />

      <div className="dashboard-body">
        <Sidebar />

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}