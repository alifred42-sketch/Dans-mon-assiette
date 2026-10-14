import { FetesNavigation } from "@/components/fetes-navigation";

export default function FetesPage() {
  return (
    <main className="min-h-dvh bg-[#F9F9F7] px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <FetesNavigation showBack />
      </div>
    </main>
  );
}
