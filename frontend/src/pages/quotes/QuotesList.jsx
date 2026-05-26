import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { quotesApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Badge } from '../../components/primitives/Badge.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { Skeleton, EmptyState } from '../../components/primitives/EmptyState.jsx';
import { formatCurrency, formatDate } from '../../lib/format.js';

const STATUS_VARIANT = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  revised: 'warn',
};

export function QuotesList() {
  const nav = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['quotes'], queryFn: () => quotesApi.list() });

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle="All quotes across leads"
        actions={
          <Button variant="primary" onClick={() => nav('/quotes/new')} leftIcon={<Plus size={14} />}>
            New Quote
          </Button>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (data?.items || []).length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotes yet"
            description="Create your first quote tied to a lead."
            action={
              <Button variant="primary" onClick={() => nav('/quotes/new')} leftIcon={<Plus size={14} />}>
                New quote
              </Button>
            }
          />
        ) : (
          <div className="ff-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-elev2/60">
                <tr className="text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">Quote #</th>
                  <th className="px-4 py-2.5 font-medium">Lead</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created by</th>
                  <th className="px-4 py-2.5 font-medium">Issued</th>
                  <th className="px-4 py-2.5 font-medium text-right">Grand total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((q) => (
                  <tr
                    key={q._id}
                    onClick={() => nav(`/quotes/${q._id}`)}
                    className="border-t border-border hover:bg-elev2/40 ff-transition cursor-pointer"
                  >
                    <td className="px-4 py-2.5 ff-mono text-sm text-text">{q.quoteNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-text">{q.lead?.companyName}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={STATUS_VARIANT[q.status]} className="capitalize">
                        {q.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={q.createdBy?.name} size={22} />
                        <span className="text-sm text-text">{q.createdBy?.name?.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted">{formatDate(q.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right ff-mono text-sm text-text">
                      {formatCurrency(q.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
