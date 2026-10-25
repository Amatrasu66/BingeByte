import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SectionHeading } from "@/components/section-heading";
import { MediaCard } from "@/components/media/media-card";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import { sampleMediaItems } from "@/lib/fixtures";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <AppShell>
      <main className="py-12 sm:py-16 lg:py-20">
        <MainContainer className="space-y-16 sm:space-y-24">
          {/* Hero / System Introduction */}
          <section aria-labelledby="hero-title" className="max-w-3xl">
            <h1
              id="hero-title"
              className="text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl"
            >
              {siteConfig.name}
            </h1>
            <p className="mt-4 text-lg sm:text-xl leading-relaxed text-[var(--color-text-secondary)]">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button variant="primary" size="lg">
                Explore Components
              </Button>
              <Button variant="secondary" size="lg">
                Design Tokens
              </Button>
            </div>
          </section>

          <Separator />

          {/* Section 1: Color Tokens Foundation */}
          <section aria-labelledby="tokens-title" className="space-y-6">
            <SectionHeading
              title="Approved Palette Foundation"
              description="Authoritative charcoal-purple palette from design/design.md with exact token specifications."
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-4">
                <div className="h-10 w-full rounded border border-[var(--color-border-subtle)] bg-[#151319]" />
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  Background
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  #151319
                </p>
              </div>

              <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                <div className="h-10 w-full rounded border border-[var(--color-border-subtle)] bg-[#1B1820]" />
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  Surface
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  #1B1820
                </p>
              </div>

              <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                <div className="h-10 w-full rounded border border-[var(--color-border-subtle)] bg-[#100F13]" />
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  Deep Surface
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  #100F13
                </p>
              </div>

              <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                <div className="h-10 w-full rounded border border-[var(--color-border-subtle)] bg-[#302B36]" />
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  Subtle Border
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  #302B36
                </p>
              </div>

              <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                <div className="h-10 w-full rounded border border-[var(--color-border-subtle)] bg-[#F5F3F7]" />
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  Primary Text
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  #F5F3F7
                </p>
              </div>

              <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                <div className="h-10 w-full rounded border border-[var(--color-border-subtle)] bg-[#AAA5B2]" />
                <p className="mt-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  Secondary Text
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  #AAA5B2
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 2: Reusable Button Variants & Sizes */}
          <section aria-labelledby="buttons-title" className="space-y-6">
            <SectionHeading
              title="Button Components"
              description="Restrained, accessible action controls in primary, secondary, and ghost variants."
            />

            <div className="space-y-6 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
              {/* Primary Variant */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                    Primary Actions
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    High-contrast soft-white fill on dark background
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">
                    Small
                  </Button>
                  <Button variant="primary" size="md">
                    Medium
                  </Button>
                  <Button variant="primary" size="lg">
                    Large
                  </Button>
                  <Button variant="primary" size="md" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Secondary Variant */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                    Secondary Actions
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Restrained elevated surface with subtle border
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" size="sm">
                    Small
                  </Button>
                  <Button variant="secondary" size="md">
                    Medium
                  </Button>
                  <Button variant="secondary" size="lg">
                    Large
                  </Button>
                  <Button variant="secondary" size="md" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Ghost Variant */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                    Ghost Actions
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Transparent background with subtle hover state
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="ghost" size="sm">
                    Small
                  </Button>
                  <Button variant="ghost" size="md">
                    Medium
                  </Button>
                  <Button variant="ghost" size="lg">
                    Large
                  </Button>
                  <Button variant="ghost" size="md" disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 3: Media Card Demonstration */}
          <section aria-labelledby="media-cards-title" className="space-y-6">
            <SectionHeading
              title="Media Card Component"
              description="Standard 2:3 cinematic poster aspect ratio with title, metadata, and hover response."
              action={
                <Button variant="ghost" size="sm">
                  View Specifications
                </Button>
              }
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {sampleMediaItems.map((item) => (
                <MediaCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  year={item.year}
                  mediaType={item.mediaType}
                  rating={item.rating}
                  quality={item.quality}
                />
              ))}
            </div>
          </section>

          <Separator />

          {/* Section 4: Loading Skeletons */}
          <section aria-labelledby="skeletons-title" className="space-y-6">
            <SectionHeading
              title="Loading Skeletons"
              description="Subdued surface placeholders matching component geometry and respecting reduced-motion."
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              <MediaCardSkeleton />
              <MediaCardSkeleton />
              <MediaCardSkeleton />
              <MediaCardSkeleton />
            </div>
          </section>
        </MainContainer>
      </main>
    </AppShell>
  );
}
