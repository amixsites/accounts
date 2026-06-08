/**
 * AppHeader — site header for Kakatiya Institute of Technology and Science, Warangal.
 * Displays institute branding and section title without using a GIF.
 */
import "../styles/appHeader.css";

export default function AppHeader() {
  return (
    <header className="app-header-root">
      <div className="app-header-inner">
        <div className="app-header-brand">
          <span className="app-header-logo">KITSW</span>
          <div>
            <p className="app-header-title">Kakatiya Institute of Technology and Science</p>
            <p className="app-header-subtitle">Warangal — Accounts Section</p>
          </div>
        </div>
        <div className="app-header-tagline">
          <span>Modern financial operations for academic administration</span>
        </div>
      </div>
    </header>
  );
}
