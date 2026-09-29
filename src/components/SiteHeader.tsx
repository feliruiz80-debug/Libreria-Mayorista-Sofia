import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-lg justify-center px-4 pt-[max(0.35rem,env(safe-area-inset-top))]">
        <Link href="/" className="block">
          <Image
            src="/logo-mark.png"
            alt="Librería Mayorista Sofía"
            width={675}
            height={856}
            priority
            className="h-[4.75rem] w-auto"
          />
        </Link>
      </div>
      <div className="luxury-line" />
    </header>
  );
}
