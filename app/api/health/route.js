import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'tomobilty-monolith',
    platform: 'vercel',
    version: '2.0.0'
  });
}
