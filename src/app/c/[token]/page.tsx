import { notFound } from 'next/navigation';
import Image from 'next/image';

interface BenchmarkCapture {
  id: string;
  blobUrl: string;
  pageType: string | null;
  notes: string | null;
  pageTitle: string | null;
}

interface BenchmarkProduct {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  captures: BenchmarkCapture[];
}

interface PageData {
  contact: { name: string; company: string };
  deliverables: { id: number; label: string; url: string }[];
  tasks: { id: number; text: string; completed: boolean }[];
  meetings: { id: number; title: string; date: string; content: string }[];
  benchmarks: BenchmarkProduct[];
}

async function getData(token: string): Promise<PageData | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://intelligems.vercel.app';
  const res = await fetch(`${baseUrl}/api/public/contacts/${token}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<PageData>;
}

export default async function PublicContactPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getData(token);
  if (!data) notFound();

  const { contact, deliverables, tasks, meetings, benchmarks } = data;
  const openTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* Header */}
        <div className="border-b pb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Intelligems
          </p>
          <h1 className="text-2xl font-semibold">{contact.name}</h1>
          {contact.company && (
            <p className="text-muted-foreground">{contact.company}</p>
          )}
        </div>

        {/* Benchmarks */}
        {benchmarks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Benchmarks
            </h2>
            <div className="space-y-8">
              {benchmarks.map((product) => (
                <div key={product.id} className="space-y-3">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                  </div>
                  {product.captures.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {product.captures.slice(0, 6).map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border overflow-hidden"
                        >
                          <Image
                            src={c.blobUrl}
                            alt={c.pageTitle ?? product.name}
                            width={600}
                            height={400}
                            className="w-full object-cover"
                            unoptimized
                          />
                          {c.notes && (
                            <p className="px-3 py-2 text-xs text-muted-foreground">
                              {c.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Deliverables
            </h2>
            <div className="space-y-2">
              {deliverables.map((d) => (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-blue-600"
                >
                  {d.label}
                  <span className="ml-auto text-muted-foreground text-xs">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Next Steps */}
        {openTasks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Next Steps
            </h2>
            <ul className="space-y-2">
              {openTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 size-1.5 rounded-full bg-foreground shrink-0" />
                  {t.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Meeting Notes */}
        {meetings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Meeting Notes
            </h2>
            <div className="space-y-4">
              {meetings.map((m) => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{m.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.date}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {m.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t pt-6 text-xs text-muted-foreground">
          Prepared by Intelligems
        </footer>
      </div>
    </div>
  );
}
