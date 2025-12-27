import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Tommobilty API - Monolithe sur Vercel',
    version: '2.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth - Authentification',
      '/api/cars - Gestion des voitures', 
      '/api/bookings - Réservations',
      '/api/payments - Paiements Stripe',
      '/api/invoices - Facturation',
      '/api/documents - OCR et documents',
      '/api/chat - Chatbot',
      '/api/admin - Administration'
    ]
  });
}
