import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="glass mx-auto flex max-w-lg justify-center px-4 py-2">
        <Link href="/" className="block">
          <Image
            src="/icon-512.png"
            alt="Librería Mayorista Sofía"
            width={512}
            height={512}
            priority
            className="h-16 w-16 object-contain"
          />
        </Link>
      </div>
    </header>
  );
}
