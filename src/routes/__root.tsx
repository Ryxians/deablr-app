
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import appCss from "../styles.css?url"

import { Header } from "@/components/Header"
import { Navbar } from "@/components/Navbar"

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
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="p-8 leading-relaxed">
      <section className="mb-6">
        <h2 className="font-bold text-xl border-b border-border mb-2">
          Not Found
        </h2>
        <p>Sowwy, this is not a valid page.</p>
      </section>
      <section className="mb-6">
        <img src="/in-your-walls.gif" alt="I am in your walls." />
      </section>
    </main>
  ),
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
          <div className="min-h-screen text-foreground font-mono p-6">
            <div className="max-w-5xl min-w-4xl mx-auto border border-border shadow-sm bg-background">
              <Header />
              <Navbar />
              <main className="p-8 leading-relaxed">
                {children}
              </main>
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
