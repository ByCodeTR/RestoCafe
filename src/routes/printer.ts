import { Router } from 'express';
import escpos from 'escpos';
// ESC/POS USB driver
escpos.USB = require('escpos-usb');

const router = Router();

router.post('/receipt', async (req, res) => {
  try {
    const { 
      tableNumber, 
      orders, 
      payment, 
      timestamp 
    } = req.body;

    // USB yazıcıyı bul
    const device = new escpos.USB();
    const options = { encoding: "GB18030" };
    const printer = new escpos.Printer(device, options);

    // Fiş yazdırma
    device.open(function(error: any) {
      if (error) {
        console.error('Yazıcı bağlantı hatası:', error);
        return res.status(500).json({ error: 'Yazıcı bağlantı hatası' });
      }

      printer
        // Başlık
        .align('ct')
        .style('b')
        .size(1, 1)
        .text('ACAR KÖŞE RESTORAN')
        .text('--------------------------------')
        .style('normal')
        .size(0, 0)
        .text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`)
        .text(`Saat: ${new Date().toLocaleTimeString('tr-TR')}`)
        .text(`Masa: ${tableNumber}`)
        .text('--------------------------------')
        
        // Siparişler
        .align('lt')
        .text('Ürün           Adet     Tutar')
        .text('--------------------------------');

      // Siparişleri yazdır
      let total = 0;
      orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          const itemTotal = item.price * item.quantity;
          total += itemTotal;
          
          // Ürün adı max 15 karakter
          const name = item.name.padEnd(15).substring(0, 15);
          const qty = item.quantity.toString().padStart(4);
          const price = itemTotal.toFixed(2).padStart(8);
          
          printer.text(`${name} ${qty} ${price}₺`);
        });
      });

      printer
        .text('--------------------------------')
        .align('rt')
        .text(`Toplam: ${total.toFixed(2)}₺`)
        .text('--------------------------------')
        .align('ct')
        .text('Ödeme Detayı')
        .align('lt');

      // Ödeme detayları
      if (payment.paymentMethod === 'split') {
        printer
          .text(`Nakit    : ${payment.cashAmount.toFixed(2)}₺`)
          .text(`K. Kartı : ${payment.creditAmount.toFixed(2)}₺`);
      } else {
        printer.text(`${payment.paymentMethod === 'cash' ? 'Nakit' : 'K. Kartı'}: ${total.toFixed(2)}₺`);
      }

      printer
        .text('--------------------------------')
        .align('ct')
        .text('Bizi tercih ettiğiniz için')
        .text('teşekkür ederiz')
        .text('www.acarkoserestoran.com.tr')
        .text('--------------------------------')
        .cut()
        .close();
    });

    res.json({ success: true, message: 'Fiş yazdırıldı' });
  } catch (error) {
    console.error('Fiş yazdırma hatası:', error);
    res.status(500).json({ error: 'Fiş yazdırılamadı' });
  }
});

export default router; 