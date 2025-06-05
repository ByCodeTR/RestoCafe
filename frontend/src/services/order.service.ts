export const clearTableOrders = async (tableNumber: number) => {
  try {
    const response = await axios.delete(`${API_URL}/orders/table/${tableNumber}/clear`);
    return response.data;
  } catch (error) {
    console.error('Masa temizleme hatası:', error);
    throw error;
  }
}; 