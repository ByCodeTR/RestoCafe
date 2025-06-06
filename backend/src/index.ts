import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import userRoutes from './routes/user.routes'
import areaRoutes from './routes/area.routes'
import tableRoutes from './routes/table.routes'
import categoryRoutes from './routes/category.routes'
import productRoutes from './routes/product.routes'
import stockRoutes from './routes/stock.routes'
import supplierRoutes from './routes/supplier.routes'
import orderRoutes from './routes/order.routes'
import authRoutes from './routes/auth.routes'
import kitchenRoutes from './routes/kitchen.routes'
import printerRoutes from './routes/printer.routes'
import tabletTableRoutes from './routes/tablet-table.routes'
import settingsRoutes from './routes/settings.routes'
import systemRoutes from './routes/system.routes'
// Temporarily comment out problematic routes
// import backupRoutes from './routes/backup.routes'
// import reportRoutes from './routes/report.routes'
// import waiterRoutes from './routes/waiter.routes'

// Prisma bağlantısı
const prisma = new PrismaClient()

const app = express()
const port = process.env.PORT || 5000

// HTTP server oluştur
const server = createServer(app)

// Socket.IO server oluştur
export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      console.log('Socket.IO CORS check for origin:', origin);
      
      // Allowed origins (same as Express)
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'https://frontend-theta-liard-54.vercel.app',
        'https://restocafe-frontend.vercel.app',
        'https://restocafe.vercel.app'
      ];
      
      // Allow requests with no origin
      if (!origin) {
        console.log('Socket.IO CORS allowed for no origin');
        return callback(null, true);
      }
      
      // Check if origin is in allowed list or is a Vercel deployment
      if (allowedOrigins.includes(origin) || 
          origin.includes('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')) {
        console.log('Socket.IO CORS allowed for:', origin);
        callback(null, true);
      } else {
        console.log('Socket.IO CORS blocked for:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
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
  origin: function (origin, callback) {
    console.log('Express CORS check for origin:', origin);
    
    // Allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'https://frontend-theta-liard-54.vercel.app',
      'https://restocafe-frontend.vercel.app',
      'https://restocafe.vercel.app'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      console.log('Express CORS allowed for no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list or is a Vercel deployment
    if (allowedOrigins.includes(origin) || 
        origin.includes('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')) {
      console.log('Express CORS allowed for:', origin);
      callback(null, true);
    } else {
      console.log('Express CORS blocked for:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Set-Cookie']
}))

// Additional CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'https://frontend-theta-liard-54.vercel.app',
    'https://restocafe-frontend.vercel.app',
    'https://restocafe.vercel.app'
  ];

  if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Content Security Policy middleware - More permissive for development
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
  res.json({ message: 'RestoCafe API is running' })
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
// Temporarily commented out problematic routes
// app.use('/api/backup', backupRoutes)
// app.use('/api/reports', reportRoutes)
// app.use('/api/waiter', waiterRoutes)

async function main() {
  try {
    await prisma.$connect()
    console.log('Veritabanı bağlantısı başarılı')

    // Server'ı her ortamda başlat (Vercel için gerekli değil ama local test için)
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`)
      })
    }
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error)
    // Production'da process.exit kullanma
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1)
    }
  }
}

// Vercel için app'i export et
export default app

// Local development için main function'ı çalıştır
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  main()
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Bir hata oluştu' });
}); 