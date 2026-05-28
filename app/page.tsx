import Image from "next/image";
import Link from "next/link";
import { dishes } from "@/app/menu";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#171512]">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-10 pt-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b4a35]">
              Atelier Cafe
            </p>
            <h1 className="mt-3 max-w-[12ch] text-5xl font-semibold leading-[0.95] tracking-tight text-[#171512] sm:max-w-none sm:text-6xl">
              Today&apos;s menu
            </h1>
          </div>
          <div className="hidden rounded-full bg-[#26382c] px-5 py-3 text-sm font-semibold text-[#f9f4e7] sm:block">
            Open now
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
          {dishes.map((dish, index) => (
            <article
              key={dish.slug}
              className="overflow-hidden rounded-[28px] border border-[#d5d0c4] bg-white shadow-[0_18px_60px_rgba(39,36,31,0.12)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={dish.image}
                  alt={`${dish.name} plated at Atelier Cafe`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 hover:scale-105"
                  priority={index === 0}
                />
              </div>

              <div className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {dish.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#625d54]">
                      {dish.description}
                    </p>
                  </div>
                  <p className="rounded-full bg-[#f0eee6] px-3 py-1 text-sm font-bold text-[#8b4a35]">
                    {dish.price}
                  </p>
                </div>

                <Link
                  href={`/ar/${dish.slug}`}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#171512] px-5 text-sm font-semibold text-white transition hover:bg-[#8b4a35] focus:outline-none focus:ring-2 focus:ring-[#8b4a35] focus:ring-offset-2 focus:ring-offset-white"
                >
                  View in AR
                </Link>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-8 rounded-[28px] bg-[#26382c] px-5 py-6 text-[#f9f4e7] sm:flex sm:items-center sm:justify-between sm:px-7">
          <p className="max-w-lg text-lg font-medium leading-7">
            Preview your plate in augmented reality before it arrives at the
            table.
          </p>
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-[#cad8c7] sm:mt-0">
            Four signature picks
          </p>
        </footer>
      </section>
    </main>
  );
}
