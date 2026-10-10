import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center py-20">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-[0.3em]">{siteConfig.name}</p>
        <h1 className="mt-8 max-w-3xl text-5xl font-medium tracking-tight sm:text-7xl">
          A new dimension of everyday design.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
          {siteConfig.description} Our storefront is in preparation.
        </p>
      </Container>
    </main>
  );
}
