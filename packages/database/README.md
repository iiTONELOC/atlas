# Database Package

Shared database layer for the Atlas monorepo.

## Structure

- `src/entities/` - TypeORM entities
- `src/repositories/` - Repository pattern implementations
- `src/utils/` - Database utilities (hashing, validation, etc)
- `tests/` - Database tests

## Usage

```typescript
import {AppDataSource, User, UserRepository} from 'atlas-database';
```
