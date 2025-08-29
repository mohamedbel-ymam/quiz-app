<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private function normalize(string $raw): ?string {
        $p = preg_replace('/[\s\-]/', '', $raw);
        if (preg_match('/^\+212[67]\d{8}$/', $p)) return $p;
        if (preg_match('/^212[67]\d{8}$/',  $p)) return '+'.$p;
        if (preg_match('/^0[67]\d{8}$/',    $p)) return '+212'.substr($p, 1);
        return null;
    }

    public function up(): void {
        // normalize users
        $users = DB::table('users')->select('id','phone')->get();
        foreach ($users as $u) {
            if (!$u->phone) continue;
            $n = $this->normalize($u->phone);
            if ($n && $n !== $u->phone) {
                DB::table('users')->where('id',$u->id)->update(['phone'=>$n]);
            }
        }
        // normalize results
        $results = DB::table('results')->select('id','phone')->get();
        foreach ($results as $r) {
            if (!$r->phone) continue;
            $n = $this->normalize($r->phone);
            if ($n && $n !== $r->phone) {
                DB::table('results')->where('id',$r->id)->update(['phone'=>$n]);
            }
        }
    }

    public function down(): void { /* no-op */ }
};