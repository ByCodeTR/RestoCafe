import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Windows sisteminde yazıcıları listele
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    // PowerShell komutu ile yazıcıları listele
    const { stdout } = await execAsync('powershell "Get-Printer | Select-Object Name, DriverName, PortName | ConvertTo-Json"')
    
    let printers = []
    try {
      const result = JSON.parse(stdout)
      printers = Array.isArray(result) ? result : [result]
    } catch (e) {
      // JSON parse hatası varsa boş array döndür
      printers = []
    }

    // Varsayılan yazıcıları da ekle
    const defaultPrinters = [
      { Name: 'USB001 (USB Yazıcı)', DriverName: 'Generic', PortName: 'USB001' },
      { Name: 'COM1 (Seri Port)', DriverName: 'Generic', PortName: 'COM1' },
      { Name: 'IP Yazıcı (Ağ)', DriverName: 'Generic', PortName: 'Network' }
    ]

    const allPrinters = [...defaultPrinters, ...printers]

    return NextResponse.json({
      success: true,
      printers: allPrinters
    })

  } catch (error) {
    console.error('Yazıcılar listelenemedi:', error)
    
    // Hata durumunda varsayılan yazıcıları döndür
    const defaultPrinters = [
      { Name: 'USB001 (USB Yazıcı)', DriverName: 'Generic', PortName: 'USB001' },
      { Name: 'USB002 (USB Yazıcı 2)', DriverName: 'Generic', PortName: 'USB002' },
      { Name: 'COM1 (Seri Port)', DriverName: 'Generic', PortName: 'COM1' },
      { Name: 'COM2 (Seri Port 2)', DriverName: 'Generic', PortName: 'COM2' },
      { Name: 'Ağ Yazıcısı', DriverName: 'Generic', PortName: 'Network' }
    ]

    return NextResponse.json({
      success: true,
      printers: defaultPrinters
    })
  }
} 