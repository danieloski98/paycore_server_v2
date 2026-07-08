import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Delete,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import * as os from 'os';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';


@ApiTags('Upload')
@Controller('upload')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('files', { dest: os.tmpdir() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a single file',
    description: 'Upload a single file to Cloudinary storage',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadSingleFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { dest: os.tmpdir() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload multiple files',
    description: 'Upload up to 5 files to Cloudinary storage',
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid files',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadMultipleFiles(files);
  }

  @Delete(':publicId')
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Delete a file from Cloudinary storage using its public ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async deleteFile(@Param('publicId') publicId: string) {
    return this.uploadService.deleteFile(publicId);
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Get file information',
    description: 'Get information about a file from Cloudinary using its public ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File information retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getFileInfo(@Param('publicId') publicId: string) {
    return this.uploadService.getFileInfo(publicId);
  }
} 