import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { marked } from 'marked';
import { syncImpossibleListContent } from '../lib/googleDriveSync';
import styles from '../styles/ListaImpossivel.module.scss';

interface ListaImpossivelProps {
  htmlContent: string;
  error?: string;
}

export default function ListaImpossivel({ htmlContent, error }: ListaImpossivelProps) {
  return (
    <>
      <Head>
        <title>Minha Lista Impossível | Matheus Rosendo Pedreira</title>
        <meta
          name="description"
          content="Acompanhe minha lista impossível: conquistas, desafios pessoais, profissionais, esportivos e aventuras que pareciam inalcançáveis."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.fraps.dev/lista-impossivel" />
      </Head>

      <main className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            ← VOLTAR AO INÍCIO
          </Link>
          <h1 className={styles.title}>MINHA LISTA IMPOSSÍVEL</h1>
          <p className={styles.subtitle}>Inspirada na filosofia de Joel Runyon, focada em desafios que pareciam impossíveis e metas contínuas.</p>
        </div>

        {error ? (
          <div style={{ color: `#E53D00`, padding: `20px`, border: `1px solid #E53D00`, borderRadius: `4px`, textAlign: `center` }}>
            <p>
              <strong>Erro ao carregar a lista:</strong> {error}
            </p>
            <p>Verifique a conexão de rede ou a configuração do Google Drive.</p>
          </div>
        ) : (
          <article className={styles.content} dangerouslySetInnerHTML={{ __html: htmlContent }} />
        )}

        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} Matheus Rosendo Pedreira. Sincronizado automaticamente do Google Drive.</p>
        </footer>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<ListaImpossivelProps> = async () => {
  try {
    const { markdown } = await syncImpossibleListContent();

    // Configure marked options if needed (e.g. gfm, breaks)
    const htmlContent = await marked.parse(markdown, {
      gfm: true,
      breaks: true,
    });

    return {
      props: {
        htmlContent,
      },
      // Revalidate every 24 hours in production (ISR)
      revalidate: 86400,
    };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(`Error in getStaticProps for lista-impossivel:`, error);
    return {
      props: {
        htmlContent: ``,
        error: error.message || `Unknown error occurred during build`,
      },
      revalidate: 60, // Retry sooner on failure
    };
  }
};
