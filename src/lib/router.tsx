import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface RouterState {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

interface RouterContextValue {
  path: string;
  query: Record<string, string>;
  navigate: (to: string | number) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});

function parsePath(fullPath: string): RouterState {
  const [pathPart, queryString] = fullPath.split('?');
  const query: Record<string, string> = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  return { path: pathPart, params: {}, query };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<string[]>(['/']);
  const current = history[history.length - 1];
  const state = parsePath(current);

  const navigate = useCallback((to: string | number) => {
    if (typeof to === 'number') {
      setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    } else {
      setHistory(prev => [...prev, to]);
    }
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const value = useMemo(() => ({
    path: state.path,
    query: state.query,
    navigate,
    goBack,
  }), [state.path, state.query, navigate, goBack]);

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

export function useGoBack() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useGoBack must be inside RouterProvider');
  return ctx.goBack;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useLocation must be inside RouterProvider');
  return { pathname: ctx.path, query: ctx.query };
}

export function useParams(): Record<string, string> {
  return useContext(ParamsContext);
}

export function useSearchParams(): [URLSearchParams, (params: Record<string, string>) => void] {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useSearchParams must be inside RouterProvider');
  const params = useMemo(() => new URLSearchParams(ctx.query), [ctx.query]);
  const setParams = useCallback((_newParams: Record<string, string>) => {}, []);
  return [params, setParams];
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
    if (child && child.props) {
      routes.push({ path: child.props.path, element: child.props.element });
    }
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

  // 404 fallback: find a '*' catch-all route
  const fallback = routes.find(r => r.path === '*');
  if (fallback) return <>{fallback.element}</>;

  return null;
}

export function Route(_props: { path: string; element: ReactNode }) {
  return null;
}

function matchRoute(pattern: string, path: string): { params: Record<string, string> } | null {
  // Wildcard
  if (pattern === '*') return { params: {} };

  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  // Pattern with trailing optional param: if pattern ends in :param
  // allow it to match even if path has one fewer segment (param becomes empty string)
  const lastPatternPart = patternParts[patternParts.length - 1];
  const hasOptionalTrailing = lastPatternPart?.startsWith(':');

  if (patternParts.length !== pathParts.length) {
    // Allow match when path has one fewer segment than pattern and last pattern segment is a param
    if (hasOptionalTrailing && pathParts.length === patternParts.length - 1) {
      // match with empty param for the trailing segment
      const params: Record<string, string> = {};
      for (let i = 0; i < patternParts.length - 1; i++) {
        if (patternParts[i].startsWith(':')) {
          params[patternParts[i].slice(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
          return null;
        }
      }
      params[lastPatternPart.slice(1)] = '';
      return { params };
    }
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return { params };
}
