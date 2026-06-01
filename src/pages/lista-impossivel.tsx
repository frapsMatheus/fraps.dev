/* eslint-disable import/no-extraneous-dependencies */
import { useState, useEffect } from 'react';
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

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export default function ListaImpossivel({ htmlContent, error }: ListaImpossivelProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (error || !htmlContent) return;

    const article = document.querySelector(`.${styles.content}`);
    if (!article) return;

    const headingElements = article.querySelectorAll(`h1, h2, h3`);
    const items: HeadingItem[] = [];

    headingElements.forEach((el, index) => {
      const text = el.textContent || ``;

      // Clean and generate a secure slug ID for hash linking
      const id =
        text
          .toLowerCase()
          .normalize(`NFD`) // Normalize special chars like Portuguese accents
          .replace(/[\u0300-\u036f]/g, ``) // Strip out accent markers
          .replace(/[^a-z0-9]+/g, `-`)
          .replace(/(^-|-$)/g, ``) || `heading-${index}`;

      // Assign the ID back to the DOM element so standard hash links jump to it
      // eslint-disable-next-line no-param-reassign
      (el as HTMLElement).id = id;

      items.push({
        id,
        text: text.replace(/^[#\s~✅]+|[✅~]+$/g, ``).trim(), // Clean up list ticks/accents from title
        level: parseInt(el.tagName.substring(1), 10),
      });
    });

    setHeadings(items);
  }, [htmlContent, error]);

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
          <div className={styles.layoutWrapper}>
            {headings.length > 0 && (
              <aside className={styles.sidebar}>
                <h2 className={styles.tocTitle}>CONTEÚDO</h2>
                <ul className={styles.tocList}>
                  {headings.map((item) => (
                    <li key={item.id} className={`${styles.tocItem} ${styles[`level${item.level}`]}`}>
                      <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
            <article className={styles.content} dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
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
