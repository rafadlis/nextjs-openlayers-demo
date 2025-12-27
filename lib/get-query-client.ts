import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from "@tanstack/react-query";

/**
 * Create a QueryClient configured for the application's default query behavior.
 *
 * @returns A QueryClient with queries' staleTime set to 3600000 (1 hour) and a dehydration policy that includes queries when the default policy applies or the query's state is `"pending"`.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 60 * 1000,
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Provide a QueryClient instance appropriate for the current runtime environment.
 *
 * On the server, this returns a new QueryClient for each call. In the browser,
 * this returns a lazily-initialized singleton that is created once and reused
 * for subsequent calls.
 *
 * @returns A configured QueryClient instance.
 */
export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}