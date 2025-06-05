import { printReceipt } from '../services/printer.service';
import { clearTableOrders } from '../services/order.service';
import { useNavigate } from 'react-router-dom';

const PaymentModal = ({ isOpen, onClose, table, selectedOrders, totalAmount }) => {
  const navigate = useNavigate();

  const handlePayment = async () => {
    try {
      // ... existing payment processing code ...

      // Ödeme başarılı olduktan sonra fiş yazdır
      await printReceipt({
        tableNumber: table.number,
        orders: selectedOrders,
        payment: {
          paymentMethod,
          ...(paymentMethod === 'cash' && { cashAmount: totalAmount }),
          ...(paymentMethod === 'credit' && { creditAmount: totalAmount }),
          ...(paymentMethod === 'split' && {
            cashAmount: cashAmount,
            creditAmount: creditAmount
          })
        }
      });

      // Fiş yazdırıldıktan sonra masayı temizle
      await clearTableOrders(table.number);

      // Başarı mesajları
      message.success('Ödeme başarıyla tamamlandı');
      message.success('Fiş yazdırıldı');

      // Modal'ı kapat ve siparişler sayfasına yönlendir
      onClose();
      navigate('/orders');
    } catch (error) {
      console.error('Ödeme işlemi sırasında hata:', error);
      message.error('Ödeme işlemi sırasında bir hata oluştu');
    }
  };

  // ... rest of the component code ...
}; 