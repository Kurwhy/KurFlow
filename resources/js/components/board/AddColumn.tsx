import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function AddColumn({ onAdd }: { onAdd: (name: string) => Promise<boolean> }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    async function submit() {
        const trimmed = name.trim();
        if (trimmed.length < 1 || trimmed.length > 40) {
            toast.push('Nama kolom wajib diisi, 1 sampai 40 karakter.', 'error');
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            const created = await onAdd(trimmed);
            if (!created) return;
            setName('');
            setOpen(false);
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) {
        return (
            <div className="h-fit w-[240px] shrink-0 rounded-column border border-hairline bg-transparent p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setOpen(true)}
                >
                    <Plus size={14} aria-hidden="true" />
                    Kolom
                </Button>
            </div>
        );
    }

    return (
        <div className="h-fit w-[240px] shrink-0 rounded-column border border-hairline bg-surface p-2">
            <div className="flex items-center gap-1">
                <input
                    autoFocus
                    value={name}
                    maxLength={40}
                    aria-label="Nama kolom baru"
                    placeholder="Nama kolom"
                    onChange={(event) => setName(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            submit();
                        }
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            setOpen(false);
                            setName('');
                        }
                    }}
                    className="min-w-0 flex-1 rounded-[4px] border border-hairline bg-ink px-2 py-1.5 text-[13px] text-paper placeholder:text-muted focus:border-gold-400 focus:outline-none"
                />
                <button
                    type="button"
                    aria-label="Batal tambah kolom"
                    onClick={() => {
                        setOpen(false);
                        setName('');
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-[4px] text-faint hover:bg-white/[0.04] hover:text-paper max-sm:h-11 max-sm:w-11"
                >
                    <X size={13} aria-hidden="true" />
                </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted">Enter simpan · Esc batal</span>
                <Button size="sm" variant="primary" onClick={submit} disabled={submitting}>
                    Tambah
                </Button>
            </div>
        </div>
    );
}
