import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface RouterContextValue {
  pathname: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setPathname(path);
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useNavigate must be used within RouterProvider');
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useLocation must be used within RouterProvider');
  return { pathname: ctx.pathname };
}

interface RoutesProps {
  children: ReactNode;
}

export function Routes({ children }: RoutesProps) {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('Routes must be used within RouterProvider');

  const { pathname } = ctx;
  const segments = pathname.split('/').filter(Boolean);
  const routePath = '/' + segments.join('/');

  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    if (!child?.props) continue;
    const { path, element } = child.props;
    if (!path) continue;
    if (path === routePath || (path === '/' && pathname === '/')) return element;
    if (path.includes(':')) {
      const pattern = path.split('/').filter(Boolean);
      if (pattern.length === segments.length) {
        const match = pattern.every((p: string, i: number) => p.startsWith(':') || p === segments[i]);
        if (match) return element;
      }
    }
    if (path === '*' ) return element;
  }
  const starMatch = childArray.find(c => c?.props?.path === '*');
  if (starMatch) return starMatch.props.element;
  return null;
}

export function Route({ path, element }: { path: string; element: ReactNode }) {
  return { props: { path, element } } as any;
}
