import {validate} from 'class-validator';
import {EntityValidationError} from './errors';

export const validateEntity = async <T extends object>(entity: T) => {
  const validationErrors = await validate(entity);

  if (validationErrors.length > 0) {
    const errors = validationErrors.reduce(
      (acc, err) => {
        acc[err.property] = {
          constraints: Object.keys(err.constraints || {}),
          messages: Object.values(err.constraints || {}),
        };
        return acc;
      },
      {} as Record<string, {constraints: string[]; messages: string[]}>,
    );

    throw new EntityValidationError(entity.constructor.name, errors);
  }
};
