module.exports = {
  future: {
    webpack5: true,
  },
  async redirects() {
    return [
      {
        source: '/ngrok', // The path you want to redirect from
        destination: 'https://master-actual-ocelot.ngrok-free.app', // The URL you want to redirect to
        permanent: true, // Set to true for a 301 (permanent) redirect, or false for a 302 (temporary) redirect
      },
    ]
  },
};
