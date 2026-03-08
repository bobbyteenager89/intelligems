export interface BenchmarkCapture {
  id: string;
  blobUrl: string;
  pageType: string | null;
  notes: string | null;
  pageTitle: string | null;
}

export interface BenchmarkProduct {
  id: string;
  name: string;
  slug: string;
  url: string;
  tags: string[];
  description: string | null;
  captures: BenchmarkCapture[];
}

export async function fetchBenchmarks(tags: string[]): Promise<BenchmarkProduct[]> {
  if (tags.length === 0) return [];

  const baseUrl = process.env.BENCHMARKER_URL;
  const secret = process.env.BENCHMARKER_SECRET;

  if (!baseUrl || !secret) return [];

  try {
    const url = `${baseUrl}/api/internal/benchmarks?tags=${tags.join(',')}`;
    const res = await fetch(url, {
      headers: { 'x-internal-secret': secret },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
