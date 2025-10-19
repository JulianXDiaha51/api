import fs from 'fs'
import path from 'path'

const settingsPath = path.join(process.cwd(), 'src', 'settings.json')

function loadSettings() {
  try {
    const data = fs.readFileSync(settingsPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}

const rateLimitMap = new Map()

function parseRateLimit(rateLimitString) {
  if (rateLimitString === 'unlimited') {
    return { maxRequests: Infinity, windowMs: 0 }
  }

  const match = rateLimitString.match(/^(\d+)\/(minute|hour|day)$/)
  if (!match) {
    return { maxRequests: 50, windowMs: 60 * 1000 }
  }

  const [, maxRequests, unit] = match
  let windowMs

  switch (unit) {
    case 'minute':
      windowMs = 60 * 1000
      break
    case 'hour':
      windowMs = 60 * 60 * 1000
      break
    case 'day':
      windowMs = 24 * 60 * 60 * 1000
      break
    default:
      windowMs = 60 * 1000
  }

  return { maxRequests: parseInt(maxRequests), windowMs }
}

function checkRateLimit(apikey) {
  const settings = loadSettings()
  if (!settings || !settings.apiSettings || !settings.apiSettings.apikey) return false

  const apikeyConfig = settings.apiSettings.apikey[apikey]
  if (!apikeyConfig || !apikeyConfig.enabled) return false

  if (apikeyConfig.rateLimit === 'unlimited') return true

  const { maxRequests, windowMs } = parseRateLimit(apikeyConfig.rateLimit)
  const now = Date.now()
  const key = `${apikey}_${Math.floor(now / windowMs)}`

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 0, resetTime: now + windowMs })
  }

  const limitData = rateLimitMap.get(key)
  
  if (now > limitData.resetTime) {
    limitData.count = 0
    limitData.resetTime = now + windowMs
  }

  if (limitData.count >= maxRequests) {
    return false
  }

  limitData.count++
  return true
}

export function validateApiKey(req, res, next) {
  const { apikey } = req.query

  if (!apikey) {
    const settings = loadSettings()
    return res.status(401).json({
      status: false,
      creator: settings?.apiSettings?.creator || "RaolByte",
      error: "API key required",
      message: "Please provide a valid API key in the query parameters"
    })
  }

  const settings = loadSettings()
  
  if (!settings || !settings.apiSettings || !settings.apiSettings.apikey) {
    return res.status(500).json({
      status: false,
      creator: settings?.apiSettings?.creator || "RaolByte",
      error: "Server configuration error",
      message: "API key validation is not properly configured"
    })
  }

  if (!settings.apiSettings.apikey[apikey]) {
    return res.status(403).json({
      status: false,
      creator: settings?.apiSettings?.creator || "RaolByte",
      error: "Invalid API key",
      message: "The provided API key is not valid or does not exist"
    })
  }

  if (!checkRateLimit(apikey)) {
    return res.status(429).json({
      status: false,
      creator: settings?.apiSettings?.creator || "RaolByte",
      error: "Rate limit exceeded",
      message: "You have exceeded the rate limit for this API key"
    })
  }

  next()
}

export function createApiKeyMiddleware() {
  return (req, res, next) => {
    const settings = loadSettings()
    
    if (!settings || !settings.apiSettings) {
      return next()
    }
    
    if (settings.apiSettings.requireApikey === false) {
      return next()
    }
    
    if (settings.apiSettings.requireApikey === true) {
      return validateApiKey(req, res, next)
    }
    
    return next()
  }
}