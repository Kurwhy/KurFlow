<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(): RedirectResponse
    {
        if (! config('services.google.client_id') || ! config('services.google.client_secret')) {
            return redirect('/login')->with('error', 'Login Google belum dikonfigurasi.');
        }

        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $exception) {
            Log::error('Google login gagal', ['error' => $exception->getMessage()]);

            return redirect('/login')->with('error', 'Login Google gagal. Coba lagi.');
        }

        $email = $googleUser->getEmail();
        $verified = (bool) ($googleUser->user['verified_email'] ?? $googleUser->user['email_verified'] ?? false);

        if (! $email) {
            return redirect('/login')->with('error', 'Akun Google tidak membagikan email.');
        }
        if (! $verified) {
            return redirect('/login')->with('error', 'Email Google belum terverifikasi.');
        }

        $user = DB::transaction(function () use ($googleUser, $email) {
            $byGoogle = User::where('google_id', $googleUser->getId())->first();
            if ($byGoogle) {
                return $byGoogle;
            }

            $existing = User::where('email', $email)->first();
            if ($existing) {
                if ($existing->google_id && $existing->google_id !== $googleUser->getId()) {
                    return null;
                }

                $existing->forceFill([
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $existing->avatar_url ?: $googleUser->getAvatar(),
                    'email_verified_at' => $existing->email_verified_at ?? now(),
                ])->save();

                return $existing->refresh();
            }

            return User::create([
                'name' => $googleUser->getName() ?: str($email)->before('@')->toString(),
                'email' => $email,
                'password' => null,
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ]);
        });

        if (! $user) {
            return redirect('/login')->with('error', 'Akun dengan email ini sudah tertaut ke akun Google lain.');
        }

        Auth::login($user);
        request()->session()->regenerate();

        return redirect('/workspaces')->with('success', 'Masuk dengan Google berhasil.');
    }
}
