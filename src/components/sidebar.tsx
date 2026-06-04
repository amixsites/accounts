import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

const navItems = [
  { path: "/dashboard", label: "Dashboard", exact: true },
  { path: "/dashboard/students", label: "Students" },
  { path: "/dashboard/fee-collection", label: "Fee Collection" },
  { path: "/dashboard/receipts", label: "Receipts" },
  { path: "/dashboard/transactions", label: "Transactions" },
  { path: "/dashboard/due-fees", label: "Due Fees" },
  { path: "/dashboard/search", label: "Search" },
  { path: "/dashboard/reports", label: "Reports" },
  { path: "/dashboard/user-management", label: "User Management" },
  { path: "/dashboard/receipt-template", label: "Receipt Template" },
  { path: "/dashboard/help", label: "Help" },
  { path: "/dashboard/settings", label: "Settings" }
];

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h3>Navigation</h3>
      <ul>
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink 
              to={item.path}
              end={item.exact}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}