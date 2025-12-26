'use client';
export const dynamic = 'force-dynamic';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Suspense } from 'react';
import CarsPage from '@/components/cars/CarsPage';

export default function VoituresPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-white">Chargement…</div>}>
        <CarsPage />
      </Suspense>
      <Footer />
    </div>
  );
}
