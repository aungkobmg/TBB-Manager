<?php
/**
 * TBB OS — Rate Limiting Helper
 * Prevents brute-force attacks on login and other sensitive endpoints
 */

class RateLimiter
{
    private const CACHE_DIR = __DIR__ . '/../../storage/rate_limits';
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_DURATION = 900; // 15 minutes
    private const ATTEMPT_WINDOW = 300; // 5 minutes
    
    /**
     * Check if request should be rate limited
     */
    public static function isLimited(string $identifier): bool
    {
        self::ensureCacheDir();
        
        $file = self::getCacheFile($identifier);
        
        if (!file_exists($file)) {
            return false;
        }
        
        $data = json_decode(file_get_contents($file), true);
        
        if (!$data) {
            return false;
        }
        
        // Check if currently locked out
        if (isset($data['locked_until']) && time() < $data['locked_until']) {
            return true;
        }
        
        // Clean up old attempts
        $now = time();
        $recentAttempts = array_filter($data['attempts'] ?? [], function($timestamp) use ($now) {
            return ($now - $timestamp) < self::ATTEMPT_WINDOW;
        });
        
        // Check if too many recent attempts
        if (count($recentAttempts) >= self::MAX_ATTEMPTS) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Record a failed attempt
     */
    public static function recordAttempt(string $identifier): void
    {
        self::ensureCacheDir();
        
        $file = self::getCacheFile($identifier);
        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['attempts' => []];
        
        if (!$data) {
            $data = ['attempts' => []];
        }
        
        // Add current attempt
        $data['attempts'][] = time();
        
        // Clean up old attempts
        $now = time();
        $data['attempts'] = array_filter($data['attempts'], function($timestamp) use ($now) {
            return ($now - $timestamp) < self::ATTEMPT_WINDOW;
        });
        
        // Check if should lock out
        if (count($data['attempts']) >= self::MAX_ATTEMPTS) {
            $data['locked_until'] = $now + self::LOCKOUT_DURATION;
        }
        
        file_put_contents($file, json_encode($data));
        chmod($file, 0600);
    }
    
    /**
     * Clear attempts (on successful login)
     */
    public static function clearAttempts(string $identifier): void
    {
        self::ensureCacheDir();
        
        $file = self::getCacheFile($identifier);
        
        if (file_exists($file)) {
            unlink($file);
        }
    }
    
    /**
     * Get remaining lockout time in seconds
     */
    public static function getRemainingLockout(string $identifier): int
    {
        self::ensureCacheDir();
        
        $file = self::getCacheFile($identifier);
        
        if (!file_exists($file)) {
            return 0;
        }
        
        $data = json_decode(file_get_contents($file), true);
        
        if (!$data || !isset($data['locked_until'])) {
            return 0;
        }
        
        $remaining = $data['locked_until'] - time();
        return max(0, $remaining);
    }
    
    /**
     * Get cache file path for identifier
     */
    private static function getCacheFile(string $identifier): string
    {
        return self::CACHE_DIR . '/' . md5($identifier) . '.json';
    }
    
    /**
     * Ensure cache directory exists
     */
    private static function ensureCacheDir(): void
    {
        if (!is_dir(self::CACHE_DIR)) {
            mkdir(self::CACHE_DIR, 0755, true);
        }
    }
}
