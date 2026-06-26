import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';

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
  const [history, setHistory] = useState<string[]>(() => [
    window.location.pathname + window.location.search,
  ]);

  const current = history[history.length - 1];
  const state = parsePath(current);

  const navigate = useCallback((to: string | number) => {
    if (typeof to === 'number') {
      setHistory(prev => {
        if (prev.length <= 1) return prev;
        const next = prev.slice(0, -1);
        window.history.replaceState(null, '', next[next.length - 1]);
        return next;
      });
    } else {
      window.history.pushState(null, '', to);
      setHistory(prev => [...prev, to]);
    }
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      window.history.replaceState(null, '', next[next.length - 1]);
      return next;
    });
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const loc = window.location.pathname + window.location.search;
      setHistory(prev => {
        if (prev.length > 1 && prev[prev.length - 2] === loc) {
          return prev.slice(0, -1);
        }
        return [loc];
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
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
  const setParams = useCallback((newParams: Record<string, string>) => {
    const sp = new URLSearchParams(newParams);
    const path = ctx.path + (sp.toString() ? '?' + sp.toString() : '');
    window.history.pushState(null, '', path);
    // Trigger re-render via navigate — reuse navigate reference
    ctx.navigate(path);
  }, [ctx]);
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

  const lastPatternPart = patternParts[patternParts.length - 1];
  const hasOptionalTrailing = lastPatternPart?.startsWith(':');

  if (patternParts.length !== pathParts.length) {
    if (hasOptionalTrailing && pathParts.length === patternParts.length - 1) {
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
