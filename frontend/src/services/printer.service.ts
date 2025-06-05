import axios from 'axios';
import { API_URL } from '../config';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const printReceipt = async (data: {
  tableNumber: number;
  orders: any[];
  payment: {
    paymentMethod: 'cash' | 'credit' | 'split';
    cashAmount?: number;
    creditAmount?: number;
  };
}) => {
  try {
    const response = await api.post('/printers/print-receipt', {
      ...data,
      timestamp: new Date().toLocaleString('tr-TR')
    });
    return response.data;
  } catch (error) {
    console.error('Fiş yazdırma hatası:', error);
    throw error;
  }
}; 