<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;


class StudentsSeeder extends Seeder
{
    public function run(): void
    {
        $students = [
            ['name' => 'Ali',   'phone' => '+212611111111'],
            ['name' => 'Sara',  'phone' => '+212700000000'],
        ];

        foreach ($students as $s) {
            User::updateOrCreate(
                ['phone' => $s['phone']],
                ['name' => $s['name'], 'role' => 'student']
            );
        }
    }
}

