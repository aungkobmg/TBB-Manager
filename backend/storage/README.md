# Storage Directory

This directory contains:
- `logs/` - Application logs
- `rate_limits/` - Rate limiting cache files
- `.installed` - Installation lock file (created after first install)

## Permissions

Ensure this directory has proper permissions:
```bash
chmod 755 storage
chmod 755 storage/logs
chmod 755 storage/rate_limits
```

## Security

- This directory should NOT be publicly accessible via web
- Log files contain sensitive information
- Rate limit files prevent brute-force attacks
- The `.installed` file prevents reinstallation
