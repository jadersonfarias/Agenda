import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = dirname(__dirname)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['172.21.197.34', 'wife-anytime-spoilage.ngrok-free.dev'],
  turbopack: {
    root: workspaceRoot,
  },
}

export default nextConfig
