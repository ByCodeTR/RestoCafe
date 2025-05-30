import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız: Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız: Kullanıcı bulunamadı' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız: Geçersiz token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmuyor' });
    }

    next();
  };
}; 