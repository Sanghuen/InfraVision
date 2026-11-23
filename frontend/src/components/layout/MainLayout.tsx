import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

interface MainLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { label: "Overview", path: "/", icon: "O" },
  { label: "Servers", path: "/servers", icon: "S" },
  { label: "Docker", path: "/docker", icon: "D" },
  { label: "Processes", path: "/processes", icon: "P" },
  { label: "Network", path: "/network", icon: "N" },
  { label: "Storage", path: "/storage", icon: "S" },
  { label: "Logs", path: "/logs", icon: "L" },
  { label: "Settings", path: "/settings", icon: "⚙" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      // The local session is cleared by AuthContext even when the API request fails.
      console.error("Server-side sign out failed:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      {/* Fixed Sidebar */}
      <aside
        className="
        fixed inset-y-0 left-0 z-40
        flex h-screen w-[72px] flex-col
        border-r border-slate-800
        bg-slate-900
        md:w-[250px]
      "
      >
        {/* Logo */}
        <div
          className="
          flex h-16 shrink-0 items-center
          justify-center border-b border-slate-800
          px-3 md:justify-start md:px-6
        "
        >
          <div
            className="
            flex h-9 w-9 shrink-0 items-center
            justify-center rounded-lg
            bg-cyan-500/10 text-lg font-bold text-cyan-400
          "
          >
            IV
          </div>

          <div className="ml-3 hidden min-w-0 md:block">
            <h1 className="text-lg font-bold tracking-tight text-white">
              InfraVision
            </h1>
            <p className="text-[11px] text-slate-500">
              Infrastructure Explorer
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="
          min-h-0 flex-1 overflow-y-auto
          px-2 py-6 md:px-4
        "
        >
          <p
            className="
            mb-3 hidden px-3 text-[10px]
            font-semibold uppercase tracking-[0.15em]
            text-slate-500 md:block
          "
          >
            Workspace
          </p>

          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                title={item.label}
                className={({ isActive }) =>
                  `group flex items-center justify-center rounded-lg px-2 py-3 text-sm font-medium transition-all duration-200 md:justify-start md:px-3 ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`
                      flex h-7 w-7 shrink-0 items-center
                      justify-center rounded-md text-xs font-bold
                      ${
                        isActive
                          ? "bg-cyan-500/15 text-cyan-400"
                          : "bg-slate-800 text-slate-400 group-hover:text-white"
                      }
                    `}
                    >
                      {item.icon}
                    </span>

                    <span className="ml-3 hidden md:inline">{item.label}</span>

                    {isActive && (
                      <span
                        className="
                        ml-auto hidden h-1.5 w-1.5
                        rounded-full bg-cyan-400 md:block
                      "
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Fixed Sidebar Footer */}
        <div
          className="
          shrink-0 border-t border-slate-800
          p-3 md:p-4
        "
        >
          <div
            className="
            hidden rounded-lg bg-slate-800/50
            p-3 md:block
          "
          >
            <p className="text-xs font-medium text-slate-300">Infrastructure</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Monitoring Platform
            </p>
          </div>

          <div className="text-center text-[10px] text-slate-600 md:mt-3">
            v1.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="
        ml-[72px] flex min-h-screen min-w-0
        flex-col md:ml-[250px]
      "
      >
        {/* Header */}
        <header
          className="
          sticky top-0 z-30 flex h-16 shrink-0
          items-center justify-between
          border-b border-slate-800
          bg-slate-950/95 px-4 backdrop-blur-md
          sm:px-6 lg:px-8
        "
        >
          <div>
            <p className="text-sm font-medium text-slate-200">
              Infrastructure Explorer
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Monitor and explore your infrastructure
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-slate-200">
                {user?.name || "Administrator"}
              </p>
              <p className="text-[11px] text-slate-500">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>

            <div
              className="
              flex items-center gap-2 rounded-full
              border border-emerald-500/20
              bg-emerald-500/10 px-3 py-1.5
              text-xs font-medium text-emerald-400
            "
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="
                  absolute inline-flex h-full w-full
                  animate-ping rounded-full
                  bg-emerald-400 opacity-50
                "
                />
                <span
                  className="
                  relative inline-flex h-2 w-2
                  rounded-full bg-emerald-400
                "
                />
              </span>
              System Online
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <section
          className="
          w-full min-w-0 flex-1
          p-4 sm:p-6 lg:p-8
        "
        >
          {children}
        </section>
      </main>
    </div>
  );
}
