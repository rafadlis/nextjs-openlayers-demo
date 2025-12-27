"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import type * as React from "react";
import { getQueryClient } from "./get-query-client";

/**
 * Wraps children with a React Query QueryClientProvider.
 *
 * @param children - The React nodes to render inside the provider.
 * @returns A React element containing `children` wrapped by `QueryClientProvider`.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}