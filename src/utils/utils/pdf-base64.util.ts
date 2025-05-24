import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as mime from 'mime-types';

const MAX_BASE64_MB = 5;
const MAX_FILE_MB = MAX_BASE64_MB * (3 / 4); // ~3.75MB file = 5MB base64

function bufferToBase64SizeMB(buffer: Buffer): number {
  const base64Length = Math.ceil(buffer.length * 4 / 3);
  return base64Length / (1024 * 1024);
}

async function compressPdfUsingPdfLib(buffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(buffer);
  const newPdf = await PDFDocument.create();

  const copiedPages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
  copiedPages.forEach((page) => newPdf.addPage(page));

  const compressedPdf = await newPdf.save({ useObjectStreams: true });
  return Buffer.from(compressedPdf);
}

export async function fetchAndCompressPdfToBase64(url: string): Promise<{
  content: string;
  mimetype: string;
  originalname: string;
  encoding: string;
  size: number;
}> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    let fileBuffer = Buffer.from(response.data);
    const originalname = url.split('/').pop() || 'file.pdf';
    const mimetype = response.headers['content-type'] || mime.lookup(url) || 'application/pdf';

    if (mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Check original size
    const sizeMB = fileBuffer.length / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      // Try compressing
      const compressedBuffer = await compressPdfUsingPdfLib(fileBuffer);
      const compressedSizeMB = compressedBuffer.length / (1024 * 1024);
        console.log(compressedSizeMB ,'---', MAX_FILE_MB);
        
      if (compressedSizeMB > MAX_FILE_MB) {
        throw new BadRequestException(`PDF too large even after compression (${compressedSizeMB.toFixed(2)} MB)`);
      }

      fileBuffer = compressedBuffer;
    }

    const base64 = fileBuffer.toString('base64');
    const base64SizeMB = (base64.length * 3) / (4 * 1024 * 1024);
    if (base64SizeMB > MAX_BASE64_MB) {
      throw new BadRequestException('Base64-encoded PDF exceeds 5MB API limit');
    }

    return {
      content: base64,
      mimetype,
      originalname,
      encoding: '7bit',
      size: fileBuffer.length,
    };
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to fetch or process PDF');
  }
}
