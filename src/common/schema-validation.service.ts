import { Injectable } from '@nestjs/common';

@Injectable()
export class SchemaValidationService {
  validateAndGenerateJSON(schema: any, inputData: Record<string, any>) {
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
}
