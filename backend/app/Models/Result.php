<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    protected $fillable = ['student_name','subject','score','total','duration'];
        public function setPhoneAttribute($value)
    {
        $this->attributes['phone'] = $this->normalizeMaPhone($value) ?? $value;
    }
    private function normalizeMaPhone(?string $raw): ?string
    {
        if (!$raw) return null;
        $p = preg_replace('/[\s\-]/', '', $raw);
        if (preg_match('/^\+212[67]\d{8}$/', $p)) return $p;
        if (preg_match('/^212[67]\d{8}$/',  $p)) return '+'.$p;
        if (preg_match('/^0[67]\d{8}$/',    $p)) return '+212'.substr($p, 1);
        return null;
    }
}
