function getAllowedDevOrigins() {
  const origins = new Set(['localhost', '127.0.0.1'])
  const urls = [process.env.NEXTAUTH_URL]

  for (const value of urls) {
    if (!value) {
      continue
    }

    try {
      origins.add(new URL(value).hostname)
    } catch {
      continue
    }
  }

  return [...origins]
}

const backendProxyUrl = process.env.API_URL ?? 'http://127.0.0.1:3333'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: getAllowedDevOrigins(),
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${backendProxyUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
