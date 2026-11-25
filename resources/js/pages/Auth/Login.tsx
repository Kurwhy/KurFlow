import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, useFieldId } from '@/components/ui/Input';
import { AuthLayout } from '@/layouts/AuthLayout';
import type { SharedProps } from '@/types/kurflow';

export default function Login() {
    const emailId = useFieldId('login-email');
    const passwordId = useFieldId('login-password');
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });
    const { flash } = usePage<SharedProps>().props;

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    }

    return (
        <AuthLayout title="Masuk" heading="Masuk" subtitle="Lanjutkan pekerjaan tim Anda di board yang sama.">
            {flash?.error ? (
                <div role="alert" className="mb-4 rounded-[6px] border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger-soft">
                    {flash.error}
                </div>
            ) : null}

            <form onSubmit={submit} noValidate className="space-y-4">
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
                <Field label="Password" htmlFor={passwordId} error={errors.password}>
                    <Input
                        id={passwordId}
                        type="password"
                        autoComplete="current-password"
                        value={data.password}
                        invalid={Boolean(errors.password)}
                        onChange={(event) => setData('password', event.target.value)}
                    />
                </Field>
                <Button type="submit" variant="primary" className="w-full" disabled={processing}>
                    {processing ? 'Memeriksa akun...' : 'Masuk'}
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
                Masuk dengan Google
            </Link>

            <p className="mt-5 text-center text-[13px] text-muted">
                Belum punya akun?{' '}
                <Link href="/register" className="text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline">
                    Daftar
                </Link>
            </p>
        </AuthLayout>
    );
}
