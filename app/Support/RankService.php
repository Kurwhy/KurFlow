<?php

namespace App\Support;

use InvalidArgumentException;

final class RankService
{
    public const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    public const INT_DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    public static function between(?string $a, ?string $b): string
    {
        if ($a !== null) {
            self::validateOrderKey($a);
        }
        if ($b !== null) {
            self::validateOrderKey($b);
        }

        if ($a !== null && $b !== null && strcmp($a, $b) > 0) {
            [$a, $b] = [$b, $a];
        }

        if ($a === null) {
            if ($b === null) {
                return self::INT_DIGITS[intdiv(strlen(self::INT_DIGITS), 2)].self::DIGITS[0];
            }

            $integerPart = self::integerPart($b);
            $fraction = substr($b, strlen($integerPart));

            if ($integerPart === self::smallestInteger()) {
                return $integerPart.self::midpoint('', $fraction);
            }

            if (strcmp($integerPart, $b) < 0) {
                return $integerPart;
            }

            $decremented = self::decrementInteger($integerPart);
            if ($decremented === null) {
                throw new InvalidArgumentException('Rank tidak bisa diturunkan lagi.');
            }

            return $decremented;
        }

        if ($b === null) {
            $integerPart = self::integerPart($a);
            $fraction = substr($a, strlen($integerPart));
            $incremented = self::incrementInteger($integerPart);

            return $incremented === null
                ? $integerPart.self::midpoint($fraction, null)
                : $incremented;
        }

        $integerA = self::integerPart($a);
        $fractionA = substr($a, strlen($integerA));
        $integerB = self::integerPart($b);
        $fractionB = substr($b, strlen($integerB));

        if ($integerA === $integerB) {
            return $integerA.self::midpoint($fractionA, $fractionB);
        }

        $incremented = self::incrementInteger($integerA);
        if ($incremented === null) {
            throw new InvalidArgumentException('Rank tidak bisa dinaikkan lagi.');
        }

        if (strcmp($incremented, $b) < 0) {
            return $incremented;
        }

        return $integerA.self::midpoint($fractionA, null);
    }

    public static function after(?string $last): string
    {
        return self::between($last, null);
    }

    public static function isBetween(string $rank, ?string $before, ?string $after): bool
    {
        if ($before !== null && strcmp($rank, $before) <= 0) {
            return false;
        }
        if ($after !== null && strcmp($rank, $after) >= 0) {
            return false;
        }

        return true;
    }

    public static function isValidOrderKey(string $key): bool
    {
        try {
            self::validateOrderKey($key);
            return true;
        } catch (InvalidArgumentException) {
            return false;
        }
    }

    private static function midpoint(string $a, ?string $b): string
    {
        $zero = self::DIGITS[0];

        if ($b !== null && strcmp($a, $b) >= 0) {
            throw new InvalidArgumentException('Rentang rank tidak valid.');
        }
        if (($a !== '' && substr($a, -1) === $zero) || ($b !== null && $b !== '' && substr($b, -1) === $zero)) {
            throw new InvalidArgumentException('Rank tidak boleh berakhir dengan nol.');
        }

        if ($b !== null) {
            $n = 0;
            $bLength = strlen($b);
            $aLength = strlen($a);
            while ($n < $bLength && (($n < $aLength ? $a[$n] : $zero) === $b[$n])) {
                $n++;
            }
            if ($n > 0) {
                return substr($b, 0, $n).self::midpoint(substr($a, $n), substr($b, $n));
            }
        }

        $digitA = $a !== '' ? (int) strpos(self::DIGITS, $a[0]) : 0;
        $digitB = $b !== null ? (int) strpos(self::DIGITS, $b[0]) : strlen(self::DIGITS);

        if ($digitB - $digitA > 1) {
            $midDigit = (int) round(0.5 * ($digitA + $digitB));

            return self::DIGITS[$midDigit];
        }

        if ($b !== null && strlen($b) > 1) {
            return $b[0];
        }

        return self::DIGITS[$digitA].self::midpoint(substr($a, 1), null);
    }

    private static function integerLength(string $head): int
    {
        $index = strpos(self::INT_DIGITS, $head);
        if ($index === false) {
            throw new InvalidArgumentException('Head rank tidak valid: '.$head);
        }

        $half = intdiv(strlen(self::INT_DIGITS), 2);

        return $index < $half ? $half - $index + 1 : $index - $half + 2;
    }

    private static function integerPart(string $key): string
    {
        if ($key === '') {
            throw new InvalidArgumentException('Rank tidak boleh kosong.');
        }

        $length = self::integerLength($key[0]);
        if ($length > strlen($key)) {
            throw new InvalidArgumentException('Rank tidak valid: '.$key);
        }

        return substr($key, 0, $length);
    }

    private static function validateOrderKey(string $key): void
    {
        if ($key === '') {
            throw new InvalidArgumentException('Rank tidak boleh kosong.');
        }
        if ($key === self::smallestInteger()) {
            throw new InvalidArgumentException('Rank tidak valid: '.$key);
        }
        if (strlen($key) > 64) {
            throw new InvalidArgumentException('Rank maksimal 64 karakter.');
        }
        if (! preg_match('/^[0-9A-Za-z]+$/', $key)) {
            throw new InvalidArgumentException('Rank hanya boleh base-62.');
        }

        $integerPart = self::integerPart($key);
        $fraction = substr($key, strlen($integerPart));
        if ($fraction !== '' && substr($fraction, -1) === self::DIGITS[0]) {
            throw new InvalidArgumentException('Rank tidak valid: '.$key);
        }
    }

    private static function incrementInteger(string $integer): ?string
    {
        $head = $integer[0];
        $digits = substr($integer, 1);
        $trailing = '';

        for ($i = strlen($digits) - 1; $i >= 0; $i--) {
            $digit = strpos(self::DIGITS, $digits[$i]) + 1;
            if ($digit === strlen(self::DIGITS)) {
                $trailing = self::DIGITS[0].$trailing;
            } else {
                return $head.substr($digits, 0, $i).self::DIGITS[$digit].$trailing;
            }
        }

        $headIndex = strpos(self::INT_DIGITS, $head);
        if ($headIndex === strlen(self::INT_DIGITS) - 1) {
            return null;
        }

        $nextHead = self::INT_DIGITS[$headIndex + 1];
        $delta = self::integerLength($nextHead) - self::integerLength($head);

        return $nextHead.($delta > 0
            ? $trailing.self::DIGITS[0]
            : ($delta < 0 ? substr($trailing, 1) : $trailing));
    }

    private static function decrementInteger(string $integer): ?string
    {
        $head = $integer[0];
        $digits = substr($integer, 1);
        $trailing = '';
        $last = self::DIGITS[strlen(self::DIGITS) - 1];

        for ($i = strlen($digits) - 1; $i >= 0; $i--) {
            $digit = strpos(self::DIGITS, $digits[$i]) - 1;
            if ($digit === -1) {
                $trailing = $last.$trailing;
            } else {
                return $head.substr($digits, 0, $i).self::DIGITS[$digit].$trailing;
            }
        }

        $headIndex = strpos(self::INT_DIGITS, $head);
        if ($headIndex === 0) {
            return null;
        }

        $previousHead = self::INT_DIGITS[$headIndex - 1];
        $delta = self::integerLength($previousHead) - self::integerLength($head);

        return $previousHead.($delta > 0
            ? $trailing.$last
            : ($delta < 0 ? substr($trailing, 1) : $trailing));
    }

    private static function smallestInteger(): string
    {
        return self::INT_DIGITS[0].str_repeat(self::DIGITS[0], intdiv(strlen(self::INT_DIGITS), 2));
    }
}
