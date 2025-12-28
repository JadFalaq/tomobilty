import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const apiBase = process.env.BACKEND_URL || 'http://localhost:5000';
    const resp = await fetch(`${apiBase}/api/auth/inscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });

  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json({ 
      message: 'Erreur lors de l\'inscription', 
      error: error.message 
    }, { status: 500 });
  }
}
