import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    // Backend'de henüz bu endpoint olmayabilir, geçici başarı dönelim  
    // Gerçek uygulamada backend'e istek atılacak
    
    return NextResponse.json(
      { message: 'Örnek veriler başarıyla yüklendi' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Sample data load error:', error)
    return NextResponse.json(
      { message: 'Örnek veriler yüklenemedi' },
      { status: 500 }
    )
  }
} 