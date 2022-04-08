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
          Software Engineer (Android) @ <a href="http://itsme.cool/">Itsme</a>
        </h2>
        <h3>
          Computer Engineer that likes to try new things in the spare time
        </h3>
      </div>
    );
  }

  function buttons() {
    return (
      <div className={styles.buttons}>
        <a href="https://github.com/frapsMatheus">GITHUB</a>
        <a href="https://www.linkedin.com/in/matheus-rosendo-pedreira-65995698/">
          LINKEDIN
        </a>
        {/* <a>IMPOSSIBLE LIST</a>
        <a>BLOG</a> */}
        <a href="https://www.instagram.com/fraps_matheus">INSTAGRAM</a>
        <a href="https://www.notion.so/frapsmatheus/Minha-lista-imposs-vel-d26409c03a814811bcb7c842d575a458">
          IMPOSSIBLE LIST
        </a>
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
