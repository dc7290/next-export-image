/**
 * @type {import('next/dist/next-server/server/config-shared').NextConfig}
 */
const config = {
  reactStrictMode: true,
  images: {
    disableStaticImages: true,
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|webp)$/i,
      use: {
        loader: 'responsive-loader',
        options: {
          name: '[path][name].[hash].[width].[ext]',
          outputPath: 'static/chunks/images/',
          publicPath: `${basePath}/_next/static/chunks/images/`,
          sizes: [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048],
          placeholder: true,
          adapter: require('responsive-loader/sharp'),
        },
      },
    })

    return config
  },
  trailingSlash: true,
}

module.exports = config
