import { NextRequest, NextResponse } from 'next/server'

interface Props {
  params: {
    id: string
  }
}

// GET /api/suppliers/[id] - Belirli bir tedarikçiyi getir
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.get('token')?.value}`,
      },
    })

    if (!response.ok) {
      throw new Error('Tedarikçi getirilemedi')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Tedarikçi getirme hatası:', error)
    return NextResponse.json(
      { message: 'Tedarikçi getirilemedi' },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers/[id] - Tedarikçi güncelle
export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const body = await req.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${params.id}`, {
      method: 'PUT',
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
    return NextResponse.json(data)
  } catch (error) {
    console.error('Tedarikçi güncelleme hatası:', error)
    return NextResponse.json(
      { message: 'Tedarikçi güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id] - Tedarikçi sil
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${req.cookies.get('token')?.value}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Tedarikçi silme hatası:', error)
    return NextResponse.json(
      { message: 'Tedarikçi silinemedi' },
      { status: 500 }
    )
  }
} 