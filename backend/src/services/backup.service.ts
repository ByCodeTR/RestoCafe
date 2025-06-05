import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { format } from 'date-fns';

const execAsync = promisify(exec);

// Yedekleme dizini
const BACKUP_DIR = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '10', 10);

// Yedekleme dizinini oluştur
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

// Yedekleme dosya adı oluştur
const createBackupFileName = () => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  return `backup_${timestamp}.sql`;
};

// Eski yedeklemeleri temizle
const cleanOldBackups = () => {
  const files = readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql'))
    .map(file => ({
      name: file,
      path: join(BACKUP_DIR, file),
      time: statSync(join(BACKUP_DIR, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  // En eski yedeklemeleri sil
  if (files.length > MAX_BACKUPS) {
    files.slice(MAX_BACKUPS).forEach(file => {
      try {
        unlinkSync(file.path);
      } catch (error) {
        console.error(`Error deleting old backup ${file.name}:`, error);
      }
    });
  }
};

// Veritabanı yedeklemesi al
export const createBackup = async () => {
  try {
    const backupFile = join(BACKUP_DIR, createBackupFileName());
    const dbName = process.env.DATABASE_NAME || 'restocafe';
    const dbUser = process.env.DATABASE_USER || 'postgres';
    const dbPassword = process.env.DATABASE_PASSWORD;
    const dbHost = process.env.DATABASE_HOST || 'localhost';
    const dbPort = process.env.DATABASE_PORT || '5432';

    // pg_dump komutu oluştur
    const command = [
      'pg_dump',
      `-U ${dbUser}`,
      `-h ${dbHost}`,
      `-p ${dbPort}`,
      dbPassword ? `-W ${dbPassword}` : '',
      '-F p', // Plain text format
      '-b', // Include large objects
      '-v', // Verbose
      `-f ${backupFile}`,
      dbName,
    ].join(' ');

    // Yedekleme işlemini başlat
    await execAsync(command);

    // Eski yedeklemeleri temizle
    cleanOldBackups();

    return {
      success: true,
      file: backupFile,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Backup error:', error);
    throw error;
  }
};

// Yedekten geri yükle
export const restoreBackup = async (backupFile: string) => {
  try {
    if (!existsSync(backupFile)) {
      throw new Error('Yedekleme dosyası bulunamadı');
    }

    const dbName = process.env.DATABASE_NAME || 'restocafe';
    const dbUser = process.env.DATABASE_USER || 'postgres';
    const dbPassword = process.env.DATABASE_PASSWORD;
    const dbHost = process.env.DATABASE_HOST || 'localhost';
    const dbPort = process.env.DATABASE_PORT || '5432';

    // Önce veritabanını yeniden oluştur
    const dropCommand = [
      'dropdb',
      `-U ${dbUser}`,
      `-h ${dbHost}`,
      `-p ${dbPort}`,
      dbPassword ? `-W ${dbPassword}` : '',
      '--if-exists',
      dbName,
    ].join(' ');

    const createCommand = [
      'createdb',
      `-U ${dbUser}`,
      `-h ${dbHost}`,
      `-p ${dbPort}`,
      dbPassword ? `-W ${dbPassword}` : '',
      dbName,
    ].join(' ');

    // Geri yükleme komutu
    const restoreCommand = [
      'psql',
      `-U ${dbUser}`,
      `-h ${dbHost}`,
      `-p ${dbPort}`,
      dbPassword ? `-W ${dbPassword}` : '',
      `-d ${dbName}`,
      `-f ${backupFile}`,
    ].join(' ');

    // Komutları sırayla çalıştır
    await execAsync(dropCommand);
    await execAsync(createCommand);
    await execAsync(restoreCommand);

    return {
      success: true,
      file: backupFile,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Restore error:', error);
    throw error;
  }
};

// Yedekleme listesini getir
export const getBackupList = () => {
  try {
    const files = readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: join(BACKUP_DIR, file),
        size: statSync(join(BACKUP_DIR, file)).size,
        createdAt: statSync(join(BACKUP_DIR, file)).mtime,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return files;
  } catch (error) {
    console.error('Get backup list error:', error);
    throw error;
  }
};

// Otomatik yedekleme zamanlayıcısı
let backupInterval: NodeJS.Timeout | null = null;

// Otomatik yedeklemeyi başlat
export const startAutoBackup = (intervalHours = 24) => {
  if (backupInterval) {
    clearInterval(backupInterval);
  }

  // Her gün otomatik yedekleme al
  backupInterval = setInterval(async () => {
    try {
      await createBackup();
      console.log('Automatic backup created successfully');
    } catch (error) {
      console.error('Automatic backup error:', error);
    }
  }, intervalHours * 60 * 60 * 1000);

  return true;
};

// Otomatik yedeklemeyi durdur
export const stopAutoBackup = () => {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    return true;
  }
  return false;
}; 