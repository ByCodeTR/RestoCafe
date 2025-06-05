import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    const response = await fetch(`${BACKEND_URL}/api/settings/backup`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Backup POST error:', error)
    return NextResponse.json(
      { message: 'Yedekleme oluşturulamadı' },
      { status: 500 }
    )
  }
} 