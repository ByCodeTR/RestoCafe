import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')
    
    const response = await fetch(`${BACKEND_URL}/api/settings/available-printers`, {
      method: 'GET',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data, { status: 200 })
    } else {
      const errorData = await response.text()
      console.log('Backend yazıcı listesi hatası:', errorData)
      return NextResponse.json(
        { 
          success: false, 
          printers: [], 
          error: "Backend'den yazıcı listesi alınamadı" 
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Yazıcı listesi hatası:', error)
    
    return NextResponse.json(
      { 
        success: false,
        printers: [],
        error: 'Yazıcı listesi alınamadı'
      },
      { status: 500 }
    )
  }
} 