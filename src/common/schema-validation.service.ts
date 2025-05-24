import { Injectable } from '@nestjs/common';
import * as mime from 'mime-types';
import axios from 'axios';

@Injectable()
export class SchemaValidationService {
 async validateAndGenerateJSON(schema: any, inputData: Record<string, any>,imageUrl:string,isBase64:boolean,base64:object) {
    let originalVC;
  if(isBase64==false){
  originalVC = await this.fetchImageAsOriginalVC(imageUrl);
  }else{
    originalVC = base64
  }
    console.log(typeof originalVC,"imageUrl");

    const result: Record<string, any> = {};
    const missingRequiredFields: string[] = [];

    const schemaProperties = schema.jsonData.properties || {};
    const requiredKeys: string[] = schema.jsonData.required || [];

    for (const key of Object.keys(schemaProperties)) {
      const expectedType = this.inferType(schemaProperties[key]);
      const isRequired = requiredKeys.includes(key);
      const inputValue = inputData[key];

      const isEmpty =
        inputValue === undefined || inputValue === null || inputValue === '';

      if (isRequired) {
        // Apply type-specific default if empty
        let value;
        if (!isEmpty) {
          value = inputValue;
        } else {
          value =
            expectedType === 'object'
              ? {}
              : expectedType === 'number'
              ? null
              : '';
        }

        result[key] = value;

        // Check if it's still considered "missing"
        if (
          value === null ||
          (expectedType === 'string' && value === '') ||
          (expectedType === 'object' && Object.keys(value).length === 0)
        ) {
          missingRequiredFields.push(key);
        }
      } else {
        // Optional fields are added only if non-empty
        if (!isEmpty) {
          result[key] = inputValue;
        }
      }
    }
    console.log(schema);
    
if(result.originalvc){
    result.originalvc = originalVC;
}else if(result.original_vc){
    result.original_vc = originalVC;
}

    return {
      result,
      missingRequiredFields,
    };
  }

  private inferType(propertySchema: any): string {
    if (propertySchema && typeof propertySchema.type === 'string') {
      return propertySchema.type;
    }
    return 'string'; // Fallback default
  }

   async fetchImageAsOriginalVC(imageUrl: string): Promise<Record<string, any>> {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data, 'binary');
    const base64Content = buffer.toString('base64');

    const mimetype = response.headers['content-type'] || mime.lookup(imageUrl) || 'application/octet-stream';
    const originalname = imageUrl.split('/').pop() || 'image';
    const encoding = '7bit'; // You can refine this if needed
    const size = buffer.length;

    return {
      content: base64Content,
      encoding,
      mimetype,
      originalname,
      size,
    };
  }
}
