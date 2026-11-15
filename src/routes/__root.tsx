import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "../styles.css"

import { Header } from "@/components/Header"
import { SiteFooter } from "@/components/SiteFooter"
import { NotFound } from "@/components/NotFound"

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "My Digital Abode",
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen w-full min-w-0 px-3 py-4 md:px-6 md:py-8">
            <div className="mx-auto w-full max-w-5xl min-w-0 overflow-hidden rounded-2xl border border-border bg-background shadow-frame">
              <Header />
              <main className="px-4 py-8 md:px-10 md:py-10">{children}</main>
              <SiteFooter />
            </div>
          </div>
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
