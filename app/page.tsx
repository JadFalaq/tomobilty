"use client";
import HomeView from "@/components/home/HomeView";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#ff003c] overflow-x-hidden font-sans">
      <HomeView />
      <Footer />
    </div>
  );
}
