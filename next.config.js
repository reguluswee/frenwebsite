/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

const nextConfig = {
  i18n,
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/apc/:path*',
        destination: 'https://fenus.xyz/dalink/api/:path*',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/mint",
        destination: "/mint/1",
        permanent: false,
      },
      {
        source: "/stake",
        destination: "/stake/1",
        permanent: false,
      },
      {
        source: "/batch",
        destination: "/batch/fop",
        permanent: false,
      },
      {
        source: "/multitoken",
        destination: "/multi/tokens",
        permanent: false,
      },
      {
        source: "/treasury",
        destination: "/treasury/general",
        permanent: false,
      },
      {
        source: "/mdao",
        destination: "/mdao/compensateClaimed",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
