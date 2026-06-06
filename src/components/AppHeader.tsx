/**
 * AppHeader — full-width header.gif banner. Branding only, no user info.
 * User profile + logout live in the Sidebar footer instead.
 */
import "../styles/appHeader.css";

export default function AppHeader() {
  return (
    <div className="app-header-root">
      <img
        src="/header.gif"
        alt="Kakatiya Institute of Technology & Science for Women — Accounts Section"
        className="app-header-gif"
        /* Intrinsic size hints prevent layout shift while GIF loads */
        width="1200"
        height="120"
        draggable={false}
      />
    </div>
  );
}
