require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { createServer } = require('http')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

// Routes
const userRoutes = require('./backend/dist/routes/user.routes')
const areaRoutes = require('./backend/dist/routes/area.routes')
const tableRoutes = require('./backend/dist/routes/table.routes')
const categoryRoutes = require('./backend/dist/routes/category.routes')
const productRoutes = require('./backend/dist/routes/product.routes')
const stockRoutes = require('./backend/dist/routes/stock.routes')
const supplierRoutes = require('./backend/dist/routes/supplier.routes')
const orderRoutes = require('./backend/dist/routes/order.routes')
const authRoutes = require('./backend/dist/routes/auth.routes')
const kitchenRoutes = require('./backend/dist/routes/kitchen.routes')
const printerRoutes = require('./backend/dist/routes/printer.routes')
const tabletTableRoutes = require('./backend/dist/routes/tablet-table.routes')
const settingsRoutes = require('./backend/dist/routes/settings.routes')
const systemRoutes = require('./backend/dist/routes/system.routes')
const reportRoutes = require('./backend/dist/routes/report.routes')

// Prisma bağlantısı
const prisma = new PrismaClient()

const app = express()
const port = process.env.PORT || 5000

// HTTP server oluştur
const server = createServer(app)

// Socket.IO server oluştur
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // 60 saniye
  pingInterval: 25000, // 25 saniye
  transports: ['websocket']
})

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication token is required'));
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Socket'e user bilgisini ekle
    socket.data.user = decoded;

    console.log('Socket authenticated for user:', decoded.id);
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Invalid authentication token'));
  }
});

// Socket.IO'yu app'e ekle (middleware'lerde kullanabilmek için)
app.set('io', io)

// Cookie parser middleware
app.use(cookieParser())

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Content Security Policy middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'"
  )
  next()
})

app.use(express.json())

// Socket.IO bağlantı yönetimi
io.on('connection', async (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id);
  
  // Admin odasına katıl (sadece admin ve manager rolündeki kullanıcılar için)
  if (socket.data.user?.role === 'ADMIN' || socket.data.user?.role === 'MANAGER') {
    socket.join('admin');
    console.log('Admin odasına katıldı:', socket.id);
  }
  
  // Mutfak odasına katıl (sadece admin, manager ve chef rolündeki kullanıcılar için)
  if (socket.data.user?.role && ['ADMIN', 'MANAGER', 'CHEF'].includes(socket.data.user.role)) {
    socket.join('kitchen');
    console.log('Mutfak odasına katıldı:', socket.id);
  }
  
  // Bağlantı kesildiğinde
  socket.on('disconnect', async (reason) => {
    console.log('Kullanıcı ayrıldı:', socket.id, 'Sebep:', reason);
    
    // Log disconnect (simplified)
    if (socket.data?.user?.id) {
      console.log('User disconnected:', socket.data.user.id, 'Reason:', reason);
    } else {
      console.log('Anonim socket bağlantısı sonlandı:', socket.id);
    }
  });

  // Hata durumunda
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Sipariş güncellemelerini dinle
  socket.on('orderUpdate', (data) => {
    // Tüm bağlı istemcilere güncellemeyi gönder
    io.emit('orderUpdated', data);
  });

  // Room'a katılma isteği
  socket.on('join', (room) => {
    console.log(`Socket ${socket.id} ${room} odasına katılmak istiyor`);
    
    // Güvenlik kontrolü - sadece yetkili kullanıcılar belirli odalara katılabilir
    if (room === 'admin' && (socket.data.user?.role === 'ADMIN' || socket.data.user?.role === 'MANAGER')) {
      socket.join('admin');
      console.log(`Socket ${socket.id} admin odasına katıldı`);
    } else if (room === 'kitchen' && ['ADMIN', 'MANAGER', 'CHEF'].includes(socket.data.user?.role)) {
      socket.join('kitchen');
      console.log(`Socket ${socket.id} kitchen odasına katıldı`);
    } else {
      console.log(`Socket ${socket.id} ${room} odasına katılma yetkisi yok`);
    }
  });
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'RestoCafe API is running',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/areas', areaRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/kitchen', kitchenRoutes)
app.use('/api/printers', printerRoutes)
app.use('/api/tablet/tables', tabletTableRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/reports', reportRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.originalUrl 
  })
})

async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Veritabanı bağlantısı başarılı')

    server.listen(port, () => {
      console.log(`🚀 RestoCafe Server çalışıyor - Port: ${port}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🌐 API: http://localhost:${port}`)
    })
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Start the application
main().catch((error) => {
  console.error('❌ Application startup failed:', error)
  process.exit(1)
})

module.exports = app 