import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify secret token to prevent abuse
  const secret = process.env.REVALIDATION_SECRET;

  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ message: `Invalid secret token` });
  }

  try {
    // Revalidate the static /lista-impossivel page on-demand
    await res.revalidate(`/lista-impossivel`);
    return res.json({ revalidated: true, message: `Revalidation triggered successfully` });
  } catch (err: any) {
    return res.status(500).json({
      revalidated: false,
      message: `Error revalidating`,
      error: err.message || `Unknown error`,
    });
  }
}
