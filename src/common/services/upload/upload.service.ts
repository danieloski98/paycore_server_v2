import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { PrismaService } from '../../prisma/prisma.service';

interface CloudinaryStorageOptions {
  cloudinary: typeof cloudinary;
  params: {
    folder?: string;
    allowed_formats?: string[];
    transformation?: Array<{
      width?: number;
      height?: number;
      crop?: string;
    }>;
  };
}

@Injectable()
export class UploadService {
  private logger = new Logger(UploadService.name);
  private storage: any; // Using any temporarily to resolve type conflicts
  private upload: ReturnType<typeof multer>;

  constructor(
    private configService: ConfigService,
    private databaseService: PrismaService,
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });

    // Configure Cloudinary Storage
    const storageOptions: CloudinaryStorageOptions = {
      cloudinary: cloudinary,
      params: {
        folder: 'paycore',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
      },
    };

    this.storage = new CloudinaryStorage(storageOptions);

    // Configure Multer with file size limits
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    });
  }

  /**
   * Get the multer upload middleware
   */
  getUploadMiddleware() {
    return this.upload;
  }

  /**
   * Upload a single file
   */
  async uploadFile(file: Express.Multer.File) {
    try {
      this.logger.debug(file);
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'paycore',
        resource_type: 'auto',
      });

      // save it to the database and return the id
      const newItems = await this.databaseService.file.create({
        data: {
          publicId: result?.public_id,
          url: result?.secure_url,
        },
      });
      return result?.secure_url;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: Express.Multer.File[]) {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new Error(`Failed to upload files: ${error.message}`);
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file information from Cloudinary
   */
  async getFileInfo(id: string) {
    if (id.startsWith('https://')) {
      return id;
    }
    try {
      const result = await this.databaseService.file.findUnique({
        where: {
          id,
        },
      });
      return result?.url;
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}
