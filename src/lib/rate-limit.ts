interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Clean up expired entries periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Checks if a given action key is rate limited.
 * @param key Unique identifier (e.g. `login:user@example.com` or `ip:127.0.0.1`)
 * @param maxAttempts Maximum allowed attempts within the window
 * @param windowMs Window duration in milliseconds (e.g. 15 * 60 * 1000 for 15 mins)
 */
export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): RateLimitResult {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs,
    }
  }

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Resets rate limit counter for a successful operation (e.g. valid login)
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key)
}
