import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load the components for better performance
const Login = React.lazy(() => import("./pages/login"));
const Dashboard = React.lazy(() => import("./pages/dashboard"));
const DashboardHome = React.lazy(() => import("./pages/DashboardHome"));
const Students = React.lazy(() => import("./pages/students"));
const FeeCollection = React.lazy(() => import("./pages/feeCollection"));
const Receipts = React.lazy(() => import("./pages/receipts"));
const Transactions = React.lazy(() => import("./pages/transactions"));
const DueFees = React.lazy(() => import("./pages/dueFees"));
const Search = React.lazy(() => import("./pages/search"));
const Reports = React.lazy(() => import("./pages/reports"));
const UserManagement = React.lazy(() => import("./pages/userManagement"));
const ReceiptTemplate = React.lazy(() => import("./pages/receiptTemplate"));
const Help = React.lazy(() => import("./pages/help"));
const Settings = React.lazy(() => import("./pages/settings"));

// Simple loading fallback
const LoadingFallback = () => <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Login />} />
            
            <Route path="/dashboard" element={<Dashboard/>} >
              <Route index element={<DashboardHome />} />
              <Route path="students" element={<Students/>} />
              <Route path="fee-collection" element={<FeeCollection/>} />
              <Route path="receipts" element={<Receipts />} />
              <Route path="transactions" element={<Transactions/>} />
              <Route path="due-fees" element={<DueFees/>} />
              <Route path="search" element={<Search/>} />
              <Route path="reports" element={<Reports/>} />
              <Route path="user-management" element={<UserManagement/>} />
              <Route path="receipt-template" element={<ReceiptTemplate/>} />
              <Route path="help" element={<Help/>} />
              <Route path="settings" element={<Settings/>} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;