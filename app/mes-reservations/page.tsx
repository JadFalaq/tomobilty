"use client";
import BookingsPage from "@/components/bookings/BookingsPage";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-white selection:bg-[#ff003c] overflow-x-hidden font-sans">
      <main className="flex-grow">
        <BookingsPage />
      </main>
      <Footer />
    </div>
  );
}
