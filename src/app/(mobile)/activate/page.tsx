import { CardActivationForm } from "@/components/card-activation-form";
import { enableCardScanningFlag } from "@/lib/flags";

export default async function Home() {
  const showScanner = await enableCardScanningFlag();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Activate Your Card
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 px-2">
            Complete this form to activate your card and start using it right
            away.
          </p>
        </div>
        <CardActivationForm showScanner={showScanner} />
      </div>
    </main>
  );
}
