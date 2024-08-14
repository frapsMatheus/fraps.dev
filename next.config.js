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
      {
        source: '/lista-impossivel',
        destination: 'https://frapsmatheus.notion.site/Minha-lista-imposs-vel-d26409c03a814811bcb7c842d575a458',
        permanent: true,
      },
      {
        source: '/linkedin',
        destination: 'https://www.linkedin.com/in/matheus-rosendo-pedreira-65995698/',
        permanent: true,
      },
      {
        source: '/instagram',
        destination: 'https://www.instagram.com/fraps_matheus',
        permanent: true,
      },
      {
        source: '/github',
        destination: 'https://github.com/frapsMatheus',
        permanent: true,
      }
    ]
  },
};
