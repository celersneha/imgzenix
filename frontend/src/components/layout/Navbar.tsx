import { Link, NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { useNavbarAuth } from "@/hooks/useNavbarAuth";

export function Navbar() {
  const { user, isAuthenticated, handleLogout } = useNavbarAuth();

  return (
    <header className="sticky top-0 z-20  backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-foreground transition-transform duration-200 hover:-translate-y-0.5"
        >
          ImgZenix
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            Home
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link-active" : ""}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/api-keys"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link-active" : ""}`
                }
              >
                API Keys
              </NavLink>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <p className="hidden text-sm text-white sm:block">
                Hi, {user?.Name}
              </p>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
