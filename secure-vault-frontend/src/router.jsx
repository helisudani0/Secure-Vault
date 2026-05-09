import { createContext, useContext, useEffect, useMemo, useState } from "react";

const RouterContext = createContext(null);

function readLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: window.history.state,
  };
}

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const handlePopState = () => setLocation(readLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to, options = {}) => {
    if (typeof to === "number") {
      window.history.go(to);
      return;
    }

    const nextUrl = new URL(to, window.location.origin);
    const state = options.state || null;
    if (options.replace) {
      window.history.replaceState(state, "", nextUrl);
    } else {
      window.history.pushState(state, "", nextUrl);
    }
    setLocation(readLocation());
  };

  const value = useMemo(() => ({ location, navigate }), [location]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useLocation must be used within RouterProvider");
  return context.location;
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useNavigate must be used within RouterProvider");
  return context.navigate;
}

export function Navigate({ to, replace = false, state = null }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);
  return null;
}

export function Link({ to, children, replace = false, state = null, onClick, ...props }) {
  const navigate = useNavigate();

  function handleClick(event) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(to, { replace, state });
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export function useParams() {
  const { pathname } = useLocation();
  const fileMatch = pathname.match(/^\/file\/([^/]+)$/);
  return fileMatch ? { id: decodeURIComponent(fileMatch[1]) } : {};
}
