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
      </Head>
      <main className={styles.container}>
        {card()}
        {projects()}
        {buttons()}
      </main>
    </>
  );
}
