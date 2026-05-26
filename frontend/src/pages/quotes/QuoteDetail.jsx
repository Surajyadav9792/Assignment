import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { quotesApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Badge } from '../../components/primitives/Badge.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';
import { formatCurrency, formatDate } from '../../lib/format.js';

const STATUS_VARIANT = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  revised: 'warn',
};

export function QuoteDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['quote', id], queryFn: () => quotesApi.get(id) });
  const sendMut = useMutation({
    mutationFn: () => quotesApi.send(id),
    onSuccess: () => {
      toast.success('Quote sent — lead advanced to Quoted');
      qc.invalidateQueries({ queryKey: ['quote', id] });
      qc.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: () => toast.error('Failed to send'),
  });

  if (isLoading) return <Skeleton className="m-6 h-96" />;
  const q = data?.quote;
  if (!q) return <div className="p-6 text-muted">Quote not found.</div>;

  const openPdf = () => window.open(quotesApi.pdfUrl(id), '_blank');

  return (
    <div>
      <PageHeader
        title={q.quoteNumber}
        breadcrumb={
          <Link to="/quotes" className="hover:text-text inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Quotes
          </Link>
        }
        actions={
          <>
            <Button variant="secondary" leftIcon={<Download size={14} />} onClick={openPdf}>
              View PDF
            </Button>
            {q.status === 'draft' && (
              <Button
                variant="primary"
                leftIcon={<Send size={14} />}
                onClick={() => sendMut.mutate()}
                disabled={sendMut.isPending}
              >
                {sendMut.isPending ? 'Sending…' : 'Send quote'}
              </Button>
            )}
          </>
        }
      />

      <div className="p-6 max-w-5xl space-y-5">
        <div className="ff-card p-5 flex items-center justify-between">
          <div>
            <div className="ff-section-title mb-1">Lead</div>
            <Link
              to={`/leads/${q.lead?._id}`}
              className="text-md text-accent hover:underline"
            >
              {q.lead?.companyName}
            </Link>
            <div className="text-sm text-muted">{q.lead?.contactName}</div>
          </div>
          <Badge variant={STATUS_VARIANT[q.status]} className="capitalize text-sm">
            {q.status}
          </Badge>
        </div>

        <div className="ff-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border ff-section-title">Line items</div>
          <table className="w-full">
            <thead className="bg-elev2/40">
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium text-right">Qty</th>
                <th className="px-4 py-2 font-medium text-right">Unit ₹</th>
                <th className="px-4 py-2 font-medium text-right">Disc %</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((it, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2 text-sm text-text">{it.productName}</td>
                  <td className="px-4 py-2 ff-mono text-xs text-muted">{it.sku || '—'}</td>
                  <td className="px-4 py-2 text-right ff-mono text-sm">{it.quantity}</td>
                  <td className="px-4 py-2 text-right ff-mono text-sm">{formatCurrency(it.unitPrice)}</td>
                  <td className="px-4 py-2 text-right ff-mono text-sm">{it.discountPct}%</td>
                  <td className="px-4 py-2 text-right ff-mono text-sm text-text">
                    {formatCurrency(it.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-5 py-4 grid grid-cols-2 gap-4">
            <div className="text-xs text-muted">
              {q.notes && (
                <>
                  <div className="ff-section-title mb-1">Notes</div>
                  <p className="text-sm text-text">{q.notes}</p>
                </>
              )}
              {q.validUntil && (
                <div className="mt-3">
                  <div className="ff-section-title mb-1">Valid until</div>
                  <p className="text-sm text-text">{formatDate(q.validUntil)}</p>
                </div>
              )}
            </div>
            <div className="space-y-2 max-w-xs ml-auto w-full">
              <Row label="Subtotal" value={formatCurrency(q.subtotal)} />
              <Row label={`Tax (${q.taxPct}%)`} value={formatCurrency(q.taxAmount)} />
              <div className="border-t border-border my-2" />
              <Row label="Grand total" value={formatCurrency(q.grandTotal)} big />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, big }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className={`ff-mono ${big ? 'text-xl text-text' : 'text-sm text-text'}`}>{value}</span>
    </div>
  );
}
