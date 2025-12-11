import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import React from "react";

// Define the router type based on Next.js types
type AppRouterInstance = {
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
  back: () => void;
  forward: () => void;
  prefetch: (href: string) => Promise<void>;
};

export function withAppRouter(children: React.ReactNode) {
  // You can mock any router methods you need here
  const mockRouter: AppRouterInstance = {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => Promise.resolve(),
    // ...add more if needed
  };

  return (
    <AppRouterContext.Provider value={mockRouter}>
      {children}
    </AppRouterContext.Provider>
  );
}
