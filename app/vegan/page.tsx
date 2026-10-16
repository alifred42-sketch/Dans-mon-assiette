import { VeganNavigation } from "@/components/vegan-navigation";

export default function VeganPage() {
  return (
    <main className="min-h-dvh bg-[#F9F9F7] px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <VeganNavigation showBack />
      </div>
    </main>
  );
}
