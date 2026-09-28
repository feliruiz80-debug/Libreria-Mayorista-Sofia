import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f6f1ea]/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-center px-4 py-3">
        <Link href="/" className="block">
          <Image
            src="/logo.webp"
            alt="Librería Mayorista Sofía"
            width={3888}
            height={1312}
            priority
            className="h-12 w-auto max-w-[11rem] object-contain"
          />
        </Link>
      </div>
    </header>
  );
}
