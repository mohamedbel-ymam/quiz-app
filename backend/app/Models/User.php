<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
protected $fillable = ['name','email','role','phone','degree'];


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     * 
     */
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
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
