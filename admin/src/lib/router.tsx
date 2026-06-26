import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface RouterContextValue {
  path: string;
  query: Record<string, string>;
  navigate: (to: string | number) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});

function parsePath(fullPath: string) {
  const [pathPart, queryString] = fullPath.split('?');
  const query: Record<string, string> = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  return { path: pathPart, query };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<string[]>(['/']);
  const current = history[history.length - 1];
  const { path, query } = parsePath(current);

  const navigate = useCallback((to: string | number) => {
    if (typeof to === 'number') {
      setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    } else {
      setHistory(prev => [...prev, to]);
    }
  }, []);

  const value = useMemo(() => ({ path, query, navigate }), [path, query, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useNavigate must be inside RouterProvider');
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useLocation must be inside RouterProvider');
  return { pathname: ctx.path, query: ctx.query };
}

export function useParams(): Record<string, string> {
  return useContext(ParamsContext);
}

interface RouteMatch {
  path: string;
  element: ReactNode;
}

export function Routes({ children }: { children: ReactNode }) {
  const ctx = useContext(RouterContext);
  if (!ctx) return null;

  const routes: RouteMatch[] = [];
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach((child: any) => {
    if (child?.props) routes.push({ path: child.props.path, element: child.props.element });
  });

  for (const route of routes) {
    const match = matchRoute(route.path, ctx.path);
    if (match) {
      return (
        <ParamsContext.Provider value={match.params}>
          {route.element}
        </ParamsContext.Provider>
      );
    }
  }

  const fallback = routes.find(r => r.path === '*');
  if (fallback) return <>{fallback.element}</>;
  return null;
}

export function Route(_props: { path: string; element: ReactNode }) {
  return null;
}

function matchRoute(pattern: string, path: string): { params: Record<string, string> } | null {
  if (pattern === '*') return { params: {} };

  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  const lastPP = patternParts[patternParts.length - 1];
  const hasOptional = lastPP?.startsWith(':');

  if (patternParts.length !== pathParts.length) {
    if (hasOptional && pathParts.length === patternParts.length - 1) {
      const params: Record<string, string> = {};
      for (let i = 0; i < patternParts.length - 1; i++) {
        if (patternParts[i].startsWith(':')) params[patternParts[i].slice(1)] = pathParts[i];
        else if (patternParts[i] !== pathParts[i]) return null;
      }
      params[lastPP.slice(1)] = '';
      return { params };
    }
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) params[patternParts[i].slice(1)] = pathParts[i];
    else if (patternParts[i] !== pathParts[i]) return null;
  }
  return { params };
}
