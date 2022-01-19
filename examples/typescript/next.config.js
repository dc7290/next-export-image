/**
 * @type {import('next/dist/next-server/server/config-shared').NextConfig}
 */
const config = {
  reactStrictMode: true,
  images: {
    disableStaticImages: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(jpe?g|png|webp)$/i,
      use: {
        loader: 'responsive-loader',
        options: {
          name: '[path][name].[hash].[width].[ext]',
          outputPath: 'static/chunks/images/',
          publicPath: '/_next/static/chunks/images/',
          sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
          placeholder: true,
          placeholderSize: 8,
          // disable: process.env.NODE_ENV === 'development',
          adapter: require('responsive-loader/sharp'),
        },
      },
    })

    return config
  },
}

module.exports = config
