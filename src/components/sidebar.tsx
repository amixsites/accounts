import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import "../styles/sidebar.css";

const navItems = [
  { path: "/dashboard",                    label: "Dashboard",        exact: true },
  { path: "/dashboard/students",           label: "Students"                      },
  { path: "/dashboard/fee-collection",     label: "Fee Collection"                },
  { path: "/dashboard/receipts",           label: "Receipts"                      },
  { path: "/dashboard/transactions",       label: "Transactions"                  },
  { path: "/dashboard/due-fees",           label: "Due Fees"                      },
  { path: "/dashboard/search",             label: "Search"                        },
  { path: "/dashboard/reports",            label: "Reports"                       },
  { path: "/dashboard/user-management",    label: "User Management"               },
  { path: "/dashboard/receipt-template",   label: "Receipt Template"              },
  { path: "/dashboard/help",               label: "Help"                          },
  { path: "/dashboard/settings",           label: "Settings"                      },
];

export default function Sidebar() {
  const navigate   = useNavigate();
  const userStr    = localStorage.getItem("user");
  const user       = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  /* Derive initials for the avatar circle */
  const initials = user?.full_name
    ? user.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <aside className="sidebar">
      {/* ── Navigation label ── */}
      <h3 className="sidebar-nav-label">Navigation</h3>

      {/* ── Nav links ── */}
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink to={item.path} end={item.exact ?? false}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* ── User profile footer ── */}
      {user && (
        <div className="sidebar-user">
          {/* Avatar */}
          <div className="sidebar-user-avatar" aria-hidden="true">
            {initials}
          </div>

          {/* Name + role */}
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.full_name}</span>
            <span className="sidebar-user-role">{user.role}</span>
          </div>

          {/* Logout */}
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  );
}
