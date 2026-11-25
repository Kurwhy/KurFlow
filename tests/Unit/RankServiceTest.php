<?php

namespace Tests\Unit;

use App\Support\RankService;
use PHPUnit\Framework\TestCase;

class RankServiceTest extends TestCase
{
    public function test_matches_fractional_indexing_reference_values(): void
    {
        $cases = [
            [null, null, 'a0'],
            ['a0', null, 'a1'],
            [null, 'a0', 'Zz'],
            ['a0', 'a1', 'a0V'],
            ['a0', 'a0V', 'a0G'],
            ['a0V', 'a1', 'a0l'],
            ['a0', 'a2', 'a1'],
            ['Zz', null, 'a0'],
            [null, 'Zz', 'Zy'],
            ['a1', null, 'a2'],
            ['a0', 'a0G', 'a08'],
            ['az', null, 'b00'],
            ['a0V', 'a0l', 'a0d'],
            ['b00', null, 'b01'],
            ['a0', 'b00', 'a1'],
            [null, 'b00', 'az'],
        ];

        foreach ($cases as [$before, $after, $expected]) {
            $this->assertSame($expected, RankService::between($before, $after), json_encode([$before, $after]));
        }
    }

    public function test_rank_validation_and_bounds(): void
    {
        $this->assertTrue(RankService::isValidOrderKey('a0V'));
        $this->assertFalse(RankService::isValidOrderKey('A0'));
        $this->assertFalse(RankService::isValidOrderKey('a0-'));
        $this->assertTrue(RankService::isBetween('a0V', 'a0', 'a1'));
        $this->assertFalse(RankService::isBetween('a1', 'a0', 'a1'));
        $this->assertFalse(RankService::isBetween('a0', 'a0', null));
    }

    public function test_keys_sort_between_bounds(): void
    {
        $low = 'a0';
        $high = 'a1';
        $generated = [];

        for ($i = 0; $i < 30; $i++) {
            $mid = RankService::between($low, $high);
            $this->assertGreaterThan($low, $mid);
            $this->assertLessThan($high, $mid);
            $generated[] = $mid;
            $high = $mid;
        }

        $this->assertCount(30, array_unique($generated));
    }
}
