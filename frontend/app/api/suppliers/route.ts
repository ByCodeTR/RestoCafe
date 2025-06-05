import { NextRequest, NextResponse } from 'next/server'

// GET /api/suppliers - Tüm tedarikçileri getir
export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.get('token')?.value}`,
      },
    })

    if (!response.ok) {
      throw new Error('Tedarikçiler getirilemedi')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Tedarikçiler getirme hatası:', error)
    return NextResponse.json(
      { message: 'Tedarikçiler getirilemedi' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Yeni tedarikçi oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.cookies.get('token')?.value}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Tedarikçi oluşturma hatası:', error)
    return NextResponse.json(
      { message: 'Tedarikçi oluşturulamadı' },
      { status: 500 }
    )
  }
} 