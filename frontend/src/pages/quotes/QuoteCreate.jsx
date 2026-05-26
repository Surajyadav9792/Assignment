import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { quotesApi, leadsApi, settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Input, Textarea, Select, Label } from '../../components/primitives/Input.jsx';
import { formatCurrency } from '../../lib/format.js';

export function QuoteCreate() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const preselectedLead = params.get('lead') || '';

  const [leadId, setLeadId] = useState(preselectedLead);
  const [items, setItems] = useState([
    { productId: '', productName: '', sku: '', quantity: 1, unitPrice: 0, discountPct: 0 },
  ]);
  const [taxPct, setTaxPct] = useState(18);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const { data: leadsRes } = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: () => leadsApi.list({ limit: 100 }),
  });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: settingsApi.products.list });

  const createMut = useMutation({
    mutationFn: (data) => quotesApi.create(data),
    onSuccess: (res) => {
      toast.success(`Quote ${res.quote.quoteNumber} created`);
      nav(`/quotes/${res.quote._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create quote'),
  });

  const updateItem = (i, patch) => {
    setItems((items) => items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const removeItem = (i) => setItems((items) => items.filter((_, idx) => idx !== i));
  const addItem = () =>
    setItems((items) => [
      ...items,
      { productId: '', productName: '', sku: '', quantity: 1, unitPrice: 0, discountPct: 0 },
    ]);

  const subtotal = items.reduce((s, it) => {
    const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
    const disc = (gross * (Number(it.discountPct) || 0)) / 100;
    return s + (gross - disc);
  }, 0);
  const taxAmount = (subtotal * taxPct) / 100;
  const grandTotal = subtotal + taxAmount;

  const handleProductPick = (i, productId) => {
    const p = (products?.items || []).find((p) => p._id === productId);
    if (p) {
      updateItem(i, {
        product: p._id,
        productName: p.name,
        sku: p.sku,
        unitPrice: p.defaultPrice,
      });
    }
  };

  const submit = () => {
    if (!leadId) return toast.error('Pick a lead');
    if (items.some((it) => !it.productName || !it.quantity || !it.unitPrice)) {
      return toast.error('Fill all item fields');
    }
    createMut.mutate({
      lead: leadId,
      taxPct,
      notes,
      validUntil: validUntil || undefined,
      items: items.map((it) => ({
        product: it.product || undefined,
        productName: it.productName,
        sku: it.sku,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        discountPct: Number(it.discountPct) || 0,
      })),
    });
  };

  return (
    <div>
      <PageHeader
        title="New Quote"
        breadcrumb={
          <button onClick={() => nav('/quotes')} className="hover:text-text inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Quotes
          </button>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => nav('/quotes')}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={createMut.isPending} leftIcon={<Save size={14} />}>
              {createMut.isPending ? 'Creating…' : 'Save draft'}
            </Button>
          </>
        }
      />

      <div className="p-6 max-w-5xl space-y-5">
        <div className="ff-card p-5">
          <Label>Lead *</Label>
          <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">Choose a lead…</option>
            {(leadsRes?.items || []).map((l) => (
              <option key={l._id} value={l._id}>
                {l.companyName} · {l.contactName}
              </option>
            ))}
          </Select>
        </div>

        <div className="ff-card">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="ff-section-title">Line items</div>
            <Button size="sm" variant="secondary" leftIcon={<Plus size={12} />} onClick={addItem}>
              Add item
            </Button>
          </div>
          <table className="w-full">
            <thead className="bg-elev2/40">
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium w-20">Qty</th>
                <th className="px-4 py-2 font-medium w-28">Unit ₹</th>
                <th className="px-4 py-2 font-medium w-20">Disc %</th>
                <th className="px-4 py-2 font-medium w-28 text-right">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                const disc = (gross * (Number(it.discountPct) || 0)) / 100;
                const total = gross - disc;
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2">
                      <Select
                        value={it.product || ''}
                        onChange={(e) => handleProductPick(i, e.target.value)}
                      >
                        <option value="">Pick a product…</option>
                        {(products?.items || []).map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} · {p.sku}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => updateItem(i, { quantity: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={it.unitPrice}
                        onChange={(e) => updateItem(i, { unitPrice: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={it.discountPct}
                        onChange={(e) => updateItem(i, { discountPct: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2 text-right ff-mono text-sm text-text">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeItem(i)}
                        className="text-subtle hover:text-danger p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="ff-card p-5 space-y-3">
            <div>
              <Label>Tax %</Label>
              <Input
                type="number"
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Valid until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="ff-card p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <Row label="Subtotal" value={formatCurrency(subtotal)} />
              <Row label={`Tax (${taxPct}%)`} value={formatCurrency(taxAmount)} />
              <div className="border-t border-border my-2" />
              <Row label="Grand total" value={formatCurrency(grandTotal)} big />
            </div>
            <p className="text-xs text-subtle mt-4">
              All amounts in INR. Final values may be adjusted at sending.
            </p>
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
