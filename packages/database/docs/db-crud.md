# DB Repository CRUD Operations Matrix

| Repository      | Create | FindById | Other Find Methods                                   | Update | Delete   | Special Methods           |
| --------------- | ------ | -------- | ---------------------------------------------------- | ------ | -------- | ------------------------- |
| User            | ✓      | ✓        | findByEmail, findByIdWithSessions, findByIdWithLists | ✓      | ✓ (soft) | -                         |
| Credentials     | ✓      | ✓        | findByEmail                                          | ✓      | ✓ (hard) | -                         |
| List            | ✓      | ✓        | findByUserId, findDefaultByUserId                    | ✓      | ✓ (hard) | -                         |
| ListItem        | ✓      | ✓        | findByListId, findByUserProductId                    | ✓      | ✓ (hard) | -                         |
| Product         | ✓      | ✓        | findByBarcode, findBySourceId                        | ✓      | ✓ (soft) | -                         |
| Source          | ✓      | ✓        | -                                                    | ✓      | ✓ (hard) | -                         |
| UserProduct     | ✓      | ✓        | findByUserId                                         | ✓      | ✓ (hard) | -                         |
| Session         | ✓      | ✓        | findByUserId, findActiveByUserId                     | ✓      | ✓ (hard) | revoke, revokeAllByUserId |
| Token           | ✓      | ✓        | findBySessionId                                      | ✗\*    | ✓ (hard) | -                         |
| RateLimitBucket | ✓      | ✓        | findOneByScopeKeyWindow                              | ✓      | ✓ (hard) | consume, reset            |

\*Token doesn't need update (tokens are immutable by design)
