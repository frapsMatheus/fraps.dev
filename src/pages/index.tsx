import styles from '../styles/Home.module.scss';

// TODO: Build Top Bar
// TODO: Build LP with minimal content
// TODO: Start my impossible list

export default function Home() {
  function card() {
    return (
      <div className={styles.card}>
        <h1>Matheus Rosendo Pedreira, aka Fraps</h1>
        <h2>
          Senior Software Engineer @ <a href="https://smiledirectclub.com/">SMILE DIRECT CLUB</a>
        </h2>
        <h3>Computer Engineer that likes to try new things in the spare time</h3>
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
    <div className={styles.container}>
      {card()}
      {buttons()}
    </div>
  );
}
