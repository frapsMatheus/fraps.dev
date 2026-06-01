import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { marked } from 'marked';
import { syncImpossibleListContent } from '../lib/googleDriveSync';
import styles from '../styles/ListaImpossivel.module.scss';

// Completely disable client-side JavaScript for maximum performance
export const config = {
  unstable_runtimeJS: false,
};

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

interface ListaImpossivelProps {
  htmlContent: string;
  headings: HeadingItem[];
  error?: string;
}

/**
 * Server-side HTML preprocessor to find h1, h2, h3 tags,
 * inject unique slug IDs directly, and build the Table of Contents tree.
 */
function processHeadingsAndInjectIds(htmlContent: string): { html: string; headings: HeadingItem[] } {
  const headingsList: HeadingItem[] = [];
  let processedHtml = htmlContent;

  const headingRegex = /<(h[1-3])\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  const matches = Array.from(processedHtml.matchAll(headingRegex));
  const idCounts = new Map<string, number>();

  matches.forEach((match) => {
    const [, tag, rawText] = match;
    const level = parseInt(tag.substring(1), 10);

    // Extract pure text by stripping inner HTML tags (e.g. strikethroughs, bold, links)
    const textContent = rawText.replace(/<[^>]*>/g, ``).trim();

    // Generate a secure slug ID
    let baseId = textContent
      .toLowerCase()
      .normalize(`NFD`) // Normalize accent marks
      .replace(/[\u0300-\u036f]/g, ``) // Strip Portuguese accent markers
      .replace(/[^a-z0-9]+/g, `-`)
      .replace(/(^-|-$)/g, ``);

    if (!baseId) {
      baseId = `section-${tag}`;
    }

    let uniqueId = baseId;
    const count = idCounts.get(baseId) || 0;
    if (count > 0) {
      uniqueId = `${baseId}-${count}`;
    }
    idCounts.set(baseId, count + 1);

    // Inject the ID directly into the heading tag
    const headingWithId = `<${tag} id="${uniqueId}">${rawText}</${tag}>`;
    processedHtml = processedHtml.replace(match[0], headingWithId);

    headingsList.push({
      id: uniqueId,
      text: textContent.replace(/^[#\s~✅]+|[✅~]+$/g, ``).trim(),
      level,
    });
  });

  return { html: processedHtml, headings: headingsList };
}

/**
 * Server-side HTML preprocessor to inject explicit width and height attributes
 * into <img> tags to improve Cumulative Layout Shift (CLS).
 */
function injectImageDimensions(htmlContent: string, dimensions: Record<string, { width: number; height: number }>): string {
  let processedHtml = htmlContent;
  const imgRegex = /<img\s+src="([^"]+)"([^>]*?)>/gi;
  const matches = Array.from(processedHtml.matchAll(imgRegex));

  matches.forEach((match) => {
    const [fullTag, src, rest] = match;
    const size = dimensions[src];
    if (size) {
      // If the tag doesn't already have explicit width/height attributes
      if (!fullTag.includes(`width=`) && !fullTag.includes(`height=`)) {
        const tagWithDimensions = `<img src="${src}" width="${size.width}" height="${size.height}"${rest}>`;
        processedHtml = processedHtml.replace(fullTag, tagWithDimensions);
      }
    }
  });

  return processedHtml;
}

export default function ListaImpossivel({ htmlContent, headings, error }: ListaImpossivelProps) {
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
            {headings && headings.length > 0 && (
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
    const { markdown, dimensions } = await syncImpossibleListContent();

    // Compile markdown to standard HTML
    const rawHtml = await marked.parse(markdown, {
      gfm: true,
      breaks: true,
    });

    // Extract headings and inject IDs during the build phase
    const { html, headings } = processHeadingsAndInjectIds(rawHtml);

    // Inject explicit dimensions (width/height) on all compiled images to prevent layout shifts
    const finalHtml = injectImageDimensions(html, dimensions);

    return {
      props: {
        htmlContent: finalHtml,
        headings,
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
        headings: [],
        error: error.message || `Unknown error occurred during build`,
      },
      revalidate: 60, // Retry sooner on failure
    };
  }
};
