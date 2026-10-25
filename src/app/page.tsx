import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Navigation Bar */}
      <header className="w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-background)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {siteConfig.name}
          </span>
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            Phase 1 · Project Foundation
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
              {siteConfig.name}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-secondary)]">
              {siteConfig.description}
            </p>
          </div>

          {/* Phase 1 Foundation Architecture Overview */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
              <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                Core Stack
              </h2>
              <p className="mt-3 text-base text-[var(--color-text-primary)]">
                Next.js App Router, React 19, TypeScript, Tailwind CSS
              </p>
            </div>

            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
              <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                Typography & Palette
              </h2>
              <p className="mt-3 text-base text-[var(--color-text-primary)]">
                Geist typography with cinematic charcoal-purple token foundation
              </p>
            </div>

            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
              <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
                Next Stage
              </h2>
              <p className="mt-3 text-base text-[var(--color-text-primary)]">
                Phase 2: Design system tokenization and component foundation
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] py-8 text-center text-sm text-[var(--color-text-secondary)]">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>{siteConfig.name}</span>
          <span>Approved Charcoal Foundation · Geist Typography</span>
        </div>
      </footer>
    </div>
  );
}
