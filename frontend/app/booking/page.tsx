"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import BookingFlow from "@/components/booking/BookingFlow";

function Content() {
  const params = useSearchParams();
  const carIdParam = params.get("car_id") || params.get("variante_car_id");
  const initialCarId = carIdParam ? parseInt(carIdParam) : undefined;

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <BookingFlow initialCarId={initialCarId} />
      </main>
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement…</div>}>
      <Content />
    </Suspense>
  );
}
