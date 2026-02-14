# Database Package

Shared database layer for the Atlas monorepo.

## Structure

- `src/db/entities/` - TypeORM entities
- `src/db/repositories/` - Repository pattern implementations
- `src/utils/` - Database utilities (hashing, validation, etc)
- `tests/` - Database tests

## Usage

```typescript
import {AppDataSource, User, UserRepository} from 'atlas-database';
```
