<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Card;
use App\Models\CardActivity;
use App\Models\CardComment;
use App\Models\Label;
use App\Models\Sprint;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class KurflowSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $password = Hash::make('password');

            $rizky = User::firstOrCreate(
                ['email' => 'rizky.pratama@kasirku.id'],
                ['name' => 'Rizky Pratama', 'password' => $password, 'email_verified_at' => now()],
            );
            $dewi = User::firstOrCreate(
                ['email' => 'dewi.lestari@kasirku.id'],
                ['name' => 'Dewi Lestari', 'password' => $password, 'email_verified_at' => now()],
            );
            $bagus = User::firstOrCreate(
                ['email' => 'bagus.santoso@kasirku.id'],
                ['name' => 'Bagus Santoso', 'password' => $password, 'email_verified_at' => now()],
            );
            $nadia = User::firstOrCreate(
                ['email' => 'nadia.putri@kasirku.id'],
                ['name' => 'Nadia Putri', 'password' => $password, 'email_verified_at' => now()],
            );
            $fajar = User::firstOrCreate(
                ['email' => 'fajar.hidayat@kasirku.id'],
                ['name' => 'Fajar Hidayat', 'password' => $password, 'email_verified_at' => now()],
            );

            $produk = Workspace::firstOrCreate(['name' => 'Tim Produk Kasirku'], ['owner_id' => $rizky->id]);
            $gudang = Workspace::firstOrCreate(['name' => 'Operasional Gudang Bandung'], ['owner_id' => $rizky->id]);

            $board = Board::firstOrCreate(['workspace_id' => $produk->id, 'name' => 'Aplikasi Kasir v2']);
            $marketplace = Board::firstOrCreate(['workspace_id' => $produk->id, 'name' => 'Integrasi Marketplace']);

            $board->members()->syncWithoutDetaching([$rizky->id, $dewi->id, $bagus->id, $nadia->id, $fajar->id]);
            $marketplace->members()->syncWithoutDetaching([$rizky->id, $dewi->id, $bagus->id, $nadia->id]);

            $columns = [];
            foreach (['Backlog' => 'a0', 'Dikerjakan' => 'a1', 'Review Kode' => 'a2', 'Selesai' => 'a3'] as $name => $rank) {
                $columns[$name] = BoardColumn::firstOrCreate(
                    ['board_id' => $board->id, 'name' => $name],
                    ['rank' => $rank],
                );
            }

            foreach (['Backlog' => 'a0', 'Dikerjakan' => 'a1', 'Review Kode' => 'a2', 'Selesai' => 'a3'] as $name => $rank) {
                BoardColumn::firstOrCreate(['board_id' => $marketplace->id, 'name' => $name], ['rank' => $rank]);
            }

            $sprint14 = Sprint::firstOrCreate(
                ['board_id' => $board->id, 'name' => 'Sprint 14'],
                [
                    'start_date' => '2025-03-03',
                    'end_date' => '2025-03-14',
                    'status' => 'aktif',
                    'started_at' => '2025-03-03 09:00:00',
                ],
            );
            Sprint::firstOrCreate(
                ['board_id' => $board->id, 'name' => 'Sprint 15'],
                ['start_date' => '2025-03-17', 'end_date' => '2025-03-28', 'status' => 'direncanakan'],
            );
            Sprint::firstOrCreate(
                ['board_id' => $board->id, 'name' => 'Sprint 13'],
                [
                    'start_date' => '2025-02-17',
                    'end_date' => '2025-02-28',
                    'status' => 'selesai',
                    'started_at' => '2025-02-17 09:00:00',
                    'completed_at' => '2025-02-28 17:00:00',
                ],
            );

            $labels = [];
            foreach ([
                'Bug' => '#E5484D',
                'Fitur' => '#D4AF37',
                'Backend' => '#3E9BD6',
                'Frontend' => '#A07CDB',
                'Mendesak' => '#F59E0B',
            ] as $name => $color) {
                $labels[$name] = Label::firstOrCreate(['board_id' => $board->id, 'name' => $name], ['color' => $color]);
            }

            $stok = Card::firstOrCreate(
                ['board_id' => $board->id, 'title' => 'Perbaiki stok minus saat transaksi offline tersinkron'],
                [
                    'column_id' => $columns['Dikerjakan']->id,
                    'sprint_id' => $sprint14->id,
                    'assignee_id' => $bagus->id,
                    'created_by' => $rizky->id,
                    'due_date' => '2025-03-10',
                    'rank' => 'a0',
                ],
            );
            $stok->labels()->syncWithoutDetaching([$labels['Bug']->id, $labels['Backend']->id]);

            $laporan = Card::firstOrCreate(
                ['board_id' => $board->id, 'title' => 'Halaman laporan penjualan harian per cabang'],
                [
                    'column_id' => $columns['Review Kode']->id,
                    'sprint_id' => $sprint14->id,
                    'assignee_id' => $dewi->id,
                    'created_by' => $rizky->id,
                    'due_date' => '2025-03-13',
                    'rank' => 'a0',
                ],
            );
            $laporan->labels()->syncWithoutDetaching([$labels['Fitur']->id, $labels['Frontend']->id]);

            $struk = Card::firstOrCreate(
                ['board_id' => $board->id, 'title' => 'Cetak struk via printer Bluetooth 58mm'],
                [
                    'column_id' => $columns['Backlog']->id,
                    'assignee_id' => $nadia->id,
                    'created_by' => $dewi->id,
                    'rank' => 'a0',
                ],
            );
            $struk->labels()->syncWithoutDetaching([$labels['Fitur']->id]);

            $npwp = Card::firstOrCreate(
                ['board_id' => $board->id, 'title' => 'Validasi NPWP pada form pelanggan grosir'],
                [
                    'column_id' => $columns['Backlog']->id,
                    'created_by' => $dewi->id,
                    'due_date' => '2025-03-20',
                    'rank' => 'a1',
                ],
            );
            $npwp->labels()->syncWithoutDetaching([$labels['Backend']->id]);

            $qris = Card::firstOrCreate(
                ['board_id' => $board->id, 'title' => 'Tombol bayar QRIS tidak merespons di Android 10'],
                [
                    'column_id' => $columns['Dikerjakan']->id,
                    'sprint_id' => $sprint14->id,
                    'assignee_id' => $rizky->id,
                    'created_by' => $nadia->id,
                    'due_date' => now()->toDateString(),
                    'rank' => 'a1',
                ],
            );
            $qris->labels()->syncWithoutDetaching([$labels['Bug']->id, $labels['Mendesak']->id]);

            CardComment::firstOrCreate(
                ['card_id' => $qris->id, 'body' => 'Sudah saya cek di Redmi Note 8, error muncul setelah timeout 30 detik.'],
                [
                    'user_id' => $nadia->id,
                    'created_at' => Carbon::parse('2025-03-12 09:15:00', 'Asia/Jakarta'),
                    'updated_at' => Carbon::parse('2025-03-12 09:15:00', 'Asia/Jakarta'),
                ],
            );
            CardComment::firstOrCreate(
                ['card_id' => $qris->id, 'body' => 'Saya ambil yang ini, PR menyusul sore ini.'],
                [
                    'user_id' => $bagus->id,
                    'created_at' => Carbon::parse('2025-03-12 10:02:00', 'Asia/Jakarta'),
                    'updated_at' => Carbon::parse('2025-03-12 10:02:00', 'Asia/Jakarta'),
                ],
            );

            CardActivity::firstOrCreate(
                ['card_id' => $laporan->id, 'to_column_name' => 'Review Kode', 'created_at' => '2025-03-12 14:32:00'],
                [
                    'user_id' => $dewi->id,
                    'from_column_id' => $columns['Dikerjakan']->id,
                    'to_column_id' => $columns['Review Kode']->id,
                    'from_column_name' => 'Dikerjakan',
                ],
            );
            CardActivity::firstOrCreate(
                ['card_id' => $qris->id, 'to_column_name' => 'Dikerjakan', 'created_at' => '2025-03-12 08:40:00'],
                [
                    'user_id' => $rizky->id,
                    'from_column_id' => $columns['Backlog']->id,
                    'to_column_id' => $columns['Dikerjakan']->id,
                    'from_column_name' => 'Backlog',
                ],
            );
            CardActivity::firstOrCreate(
                ['card_id' => $stok->id, 'to_column_name' => 'Dikerjakan', 'created_at' => '2025-03-11 09:12:00'],
                [
                    'user_id' => $bagus->id,
                    'from_column_id' => $columns['Backlog']->id,
                    'to_column_id' => $columns['Dikerjakan']->id,
                    'from_column_name' => 'Backlog',
                ],
            );
        });
    }
}
