<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/workspaces')->assertRedirect('/login');
    }

    public function test_google_redirect_requires_configuration(): void
    {
        config()->set('services.google.client_id', null);
        config()->set('services.google.client_secret', null);

        $this->get('/auth/google/redirect')
            ->assertRedirect('/login')
            ->assertSessionHas('error', 'Login Google belum dikonfigurasi.');
    }

    public function test_authenticated_user_is_redirected_away_from_login(): void
    {
        $user = User::create([
            'name' => 'Rizky Pratama',
            'email' => 'rizky@example.test',
            'password' => 'password',
        ]);

        $this->actingAs($user)->get('/login')->assertRedirect('/workspaces');
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::create([
            'name' => 'Rizky Pratama',
            'email' => 'rizky@example.test',
            'password' => 'password',
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/workspaces');

        $this->assertAuthenticatedAs($user);

        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_invalid_login_shows_generic_error(): void
    {
        User::create([
            'name' => 'Rizky Pratama',
            'email' => 'rizky@example.test',
            'password' => 'password',
        ]);

        $this->from('/login')->post('/login', [
            'email' => 'rizky@example.test',
            'password' => 'salah-password',
        ])->assertRedirect('/login')->assertSessionHasErrors(['email' => 'Email atau password salah.']);
    }

    public function test_login_is_rate_limited_after_five_failures(): void
    {
        User::create([
            'name' => 'Rizky Pratama',
            'email' => 'rizky@example.test',
            'password' => 'password',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email' => 'rizky@example.test',
                'password' => 'salah-password',
            ]);
        }

        $this->post('/login', [
            'email' => 'rizky@example.test',
            'password' => 'salah-password',
        ])->assertSessionHasErrors(['email' => 'Terlalu banyak percobaan masuk. Coba lagi dalam 60 detik.']);
    }

    public function test_user_can_register(): void
    {
        $this->post('/register', [
            'name' => 'Nadia Putri',
            'email' => 'nadia@example.test',
            'password' => 'rahasia123',
            'password_confirmation' => 'rahasia123',
        ])->assertRedirect('/workspaces');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'nadia@example.test']);
    }

    public function test_google_rejects_unverified_email(): void
    {
        $googleUser = (new \Laravel\Socialite\Two\User())
            ->map([
                'id' => 'google-unverified',
                'name' => 'Orang Google',
                'email' => 'unverified@example.test',
            ])
            ->setRaw(['verified_email' => false]);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver->user')->andReturn($googleUser);

        $this->get('/auth/google/callback')
            ->assertRedirect('/login')
            ->assertSessionHas('error', 'Email Google belum terverifikasi.');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'unverified@example.test']);
    }

    public function test_google_creates_passwordless_account(): void
    {
        $googleUser = (new \Laravel\Socialite\Two\User())
            ->map([
                'id' => 'google-999',
                'name' => 'Fajar Hidayat',
                'email' => 'fajar.google@example.test',
                'avatar' => 'https://example.test/fajar.png',
            ])
            ->setRaw(['verified_email' => true]);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver->user')->andReturn($googleUser);

        $this->get('/auth/google/callback')->assertRedirect('/workspaces');
        $this->assertAuthenticated();

        $user = User::where('email', 'fajar.google@example.test')->firstOrFail();
        $this->assertNull($user->password);
        $this->assertSame('google-999', $user->google_id);

        $this->post('/logout');

        $this->post('/login', [
            'email' => 'fajar.google@example.test',
            'password' => '',
        ])->assertSessionHasErrors(['password' => 'Password wajib diisi.']);
    }

    public function test_google_account_is_linked_by_email(): void
    {
        $user = User::create([
            'name' => 'Rizky Pratama',
            'email' => 'rizky@example.test',
            'password' => 'password',
        ]);

        $googleUser = (new \Laravel\Socialite\Two\User())
            ->map([
                'id' => 'google-123',
                'name' => 'Rizky Pratama',
                'email' => 'rizky@example.test',
                'avatar' => 'https://example.test/avatar.png',
            ])
            ->setRaw(['verified_email' => true]);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver->user')->andReturn($googleUser);

        $this->get('/auth/google/callback')->assertRedirect('/workspaces');

        $this->assertAuthenticatedAs($user->refresh());
        $this->assertSame('google-123', $user->refresh()->google_id);
    }
}
