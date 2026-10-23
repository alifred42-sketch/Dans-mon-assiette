import { FetesNavigation } from "@/components/fetes-navigation";

export default function FetesPage() {
  return (
    <main className="min-h-dvh bg-transparent px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <FetesNavigation showBack />
      </div>
    </main>
  );
}
