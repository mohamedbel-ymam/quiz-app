<?php
namespace App\Support;
class Degrees {
    public const ALL = ['degree1','degree2','degree3','degree4'];
    public static function valid(string $d): bool { return in_array($d, self::ALL, true); }
}