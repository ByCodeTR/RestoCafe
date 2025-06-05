import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    const response = await fetch(`${BACKEND_URL}/api/settings/system`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('System settings GET error:', error)
    return NextResponse.json(
      { message: 'Sistem ayarları alınamadı' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/settings/system`, {
      method: 'PUT',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('System settings PUT error:', error)
    return NextResponse.json(
      { message: 'Sistem ayarları güncellenemedi' },
      { status: 500 }
    )
  }
} 