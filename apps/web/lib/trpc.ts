import { createTRPCNext } from '@trpc/next';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';
import type { AppRouter } from '../../api/src/router';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
};

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (!ctx?.req) {
              return {};
            }
            const { connection: _connection, ...headers } = ctx.req.headers;
            return {
              ...headers,
              'x-ssr': '1',
            };
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error: any) => {
              if (error?.data?.code === 'UNAUTHORIZED') return false;
              if (error?.data?.code === 'FORBIDDEN') return false;
              if (error?.data?.code === 'NOT_FOUND') return false;
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
      },
    };
  },
  ssr: false,
});

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;