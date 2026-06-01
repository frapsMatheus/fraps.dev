import Head from 'next/head';
import styles from '../styles/Home.module.scss';

// TODO: Build Top Bar
// TODO: Build LP with minimal content
// TODO: Start my impossible list

export const config = {
  unstable_runtimeJS: false,
};

export default function Home() {
  function card() {
    return (
      <div className={styles.card}>
        <h1>Matheus Rosendo Pedreira, aka Fraps</h1>
        <h2>
          Staff Software Engineer @ <a href="https://www.suaquadra.com.br/">Sua Quadra</a>
        </h2>
        <h3>Computer Engineer that likes to try new things in the spare time</h3>
      </div>
    );
  }

  function projects() {
    return (
      <div className={styles.projects}>
        <h2>Projetos</h2>
        <a href="https://imovel.fraps.dev">Simulador de Amortização</a>
      </div>
    );
  }

  function buttons() {
    return (
      <div className={styles.buttons}>
        <a href="/lista-impossivel">IMPOSSIBLE LIST</a>
        <br />
        <a href="/github">GITHUB</a>
        <a href="/linkedin">LINKEDIN</a>
        <a href="/instagram">INSTAGRAM</a>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Matheus Rosendo Pedreira | Staff Software Engineer</title>
        <meta name="description" content="Personal website of Matheus Rosendo Pedreira (Fraps), Staff Software Engineer at Sua Quadra." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://www.fraps.dev/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': `https://schema.org`,
              '@type': `Person`,
              name: `Matheus Rosendo Pedreira`,
              alternateName: [`Matheus Rosendo`, `Fraps`],
              url: `https://www.fraps.dev/`,
              jobTitle: `Staff Software Engineer`,
              worksFor: {
                '@type': `Organization`,
                name: `Sua Quadra`,
              },
              sameAs: [
                `https://github.com/frapsMatheus`,
                `https://www.linkedin.com/in/matheus-rosendo-pedreira-65995698/`,
                `https://www.instagram.com/fraps_matheus`,
                `https://games.crossfit.com/athlete/1779951`,
              ],
            }),
          }}
        />
      </Head>
      <main className={styles.container}>
        <img src="/logo.png" alt="Fraps Logo" className={styles.logo} />
        {card()}
        {buttons()}
        {projects()}
      </main>
    </>
  );
}
