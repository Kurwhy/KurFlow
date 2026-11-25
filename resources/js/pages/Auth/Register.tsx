import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, useFieldId } from '@/components/ui/Input';
import { AuthLayout } from '@/layouts/AuthLayout';
import type { SharedProps } from '@/types/kurflow';

export default function Register() {
    const nameId = useFieldId('register-name');
    const emailId = useFieldId('register-email');
    const passwordId = useFieldId('register-password');
    const confirmId = useFieldId('register-confirm');
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const { flash } = usePage<SharedProps>().props;

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/register');
    }

    return (
        <AuthLayout
            title="Daftar"
            heading="Buat akun"
            subtitle="Mulai kelola board, sprint, dan diskusi tim di satu tempat."
        >
            {flash?.error ? (
                <div role="alert" className="mb-4 rounded-[6px] border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger-soft">
                    {flash.error}
                </div>
            ) : null}

            <form onSubmit={submit} noValidate className="space-y-4">
                <Field label="Nama" htmlFor={nameId} error={errors.name}>
                    <Input
                        id={nameId}
                        type="text"
                        autoComplete="name"
                        value={data.name}
                        invalid={Boolean(errors.name)}
                        onChange={(event) => setData('name', event.target.value)}
                    />
                </Field>
                <Field label="Email" htmlFor={emailId} error={errors.email}>
                    <Input
                        id={emailId}
                        type="email"
                        autoComplete="email"
                        value={data.email}
                        invalid={Boolean(errors.email)}
                        onChange={(event) => setData('email', event.target.value)}
                    />
                </Field>
                <Field label="Password" htmlFor={passwordId} error={errors.password} hint="Minimal 8 karakter">
                    <Input
                        id={passwordId}
                        type="password"
                        autoComplete="new-password"
                        value={data.password}
                        invalid={Boolean(errors.password)}
                        onChange={(event) => setData('password', event.target.value)}
                    />
                </Field>
                <Field label="Konfirmasi password" htmlFor={confirmId} error={errors.password_confirmation}>
                    <Input
                        id={confirmId}
                        type="password"
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        invalid={Boolean(errors.password_confirmation)}
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                    />
                </Field>
                <Button type="submit" variant="primary" className="w-full" disabled={processing}>
                    {processing ? 'Membuat akun...' : 'Daftar'}
                </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] text-muted">
                <span className="h-px flex-1 bg-hairline" />
                atau
                <span className="h-px flex-1 bg-hairline" />
            </div>

            <Link
                href="/auth/google/redirect"
                className="inline-flex h-9 w-full items-center justify-center rounded-btn border border-hairline bg-transparent px-3.5 text-sm font-medium text-paper transition-colors duration-150 hover:border-hairline-hover hover:bg-white/[0.03] max-sm:h-11"
            >
                Daftar dengan Google
            </Link>

            <p className="mt-5 text-center text-[13px] text-muted">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline">
                    Masuk
                </Link>
            </p>
        </AuthLayout>
    );
}
