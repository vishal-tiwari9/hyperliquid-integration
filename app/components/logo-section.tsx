import { LogoCloud } from "@/components/ui/logo-cloud-2";

export function LogoSection() {
  return (
    <section className="relative w-full bg-black py-16 md:py-24 border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <h2 className="mb-12 text-center font-normal text-3xl text-zinc-400 tracking-tight md:text-4xl">
          Powered by industry-standard infrastructure
        </h2>

        <LogoCloud />
      </div>
    </section>
  );
}