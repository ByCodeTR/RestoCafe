import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import areaRoutes from './routes/area.routes';
import tableRoutes from './routes/table.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import supplierRoutes from './routes/supplier.routes';
import stockRoutes from './routes/stock.routes';
import reportRoutes from './routes/report.routes';
import printerRoutes from './routes/printer.routes';
import backupRoutes from './routes/backup.routes';
import userRoutes from './routes/user.routes';
import waiterRoutes from './routes/waiter.routes';
import tabletTableRoutes from './routes/tablet-table.routes';
import billRequestRoutes from './routes/bill-request.routes';
import { handleSocketEvents } from './services/realtime.service';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000, // 1 dakika
  pingInterval: 25000, // 25 saniye
});

// Socket.IO'yu Express uygulamasına ekle
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/printers', printerRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/waiters', waiterRoutes);
app.use('/api/tablet/tables', tabletTableRoutes);
app.use('/api/bill-requests', billRequestRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Socket olaylarını yönet
  handleSocketEvents(io, socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 