import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dishes, getDish } from "@/app/menu";
import ARModelViewer from "./model-viewer";

type ARPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return dishes.map((dish) => ({
    slug: dish.slug,
  }));
}

export async function generateMetadata({ params }: ARPageProps) {
  const { slug } = await params;
  const dish = getDish(slug);

  if (!dish) {
    return {
      title: "Dish not found",
    };
  }

  return {
    title: `${dish.name} in AR | Atelier Cafe`,
    description: `Preview ${dish.name} in augmented reality before ordering.`,
  };
}

export default async function ARPage({ params }: ARPageProps) {
  const { slug } = await params;
  const dish = getDish(slug);

  if (!dish) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#171512]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d5d0c4] px-4 text-sm font-semibold text-[#27241f] transition hover:border-[#8a6b4d] hover:bg-white"
          >
            Back
          </Link>
          <span className="rounded-full bg-[#26382c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f9f4e7]">
            AR Preview
          </span>
        </div>

        <div className="grid flex-1 gap-6 px-5 pb-7 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="overflow-hidden rounded-[28px] border border-[#d5d0c4] bg-white shadow-[0_22px_70px_rgba(39,36,31,0.14)]">
            <ARModelViewer src={dish.model} alt={`${dish.name} 3D model`} />
          </div>

          <div className="space-y-6 lg:pl-4">
            <div className="relative h-40 overflow-hidden rounded-[24px] sm:h-52 lg:h-64">
              <Image
                src={dish.image}
                alt={`${dish.name} plated at Atelier Cafe`}
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <p className="absolute bottom-4 left-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/85">
                {dish.price}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b4a35]">
                Atelier Cafe
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#171512] sm:text-5xl">
                {dish.name}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#625d54]">
                {dish.description}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#d5d0c4] bg-white p-5">
              <p className="text-sm font-medium text-[#625d54]">
                On Android 16 (e.g. Moto Edge), use{" "}
                <span className="font-semibold text-[#171512]">
                  View in AR (Chrome)
                </span>
                . Scene Viewer may close instantly due to a Google app bug.
                Update Chrome, Google app, and Google Play Services for AR.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
