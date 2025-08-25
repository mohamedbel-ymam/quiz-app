<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class AdminUserController extends Controller
{
    public function index(Request $req)
    {
        $q = User::query()->orderByDesc('id');

        if ($kw = $req->query('q')) {
            $q->where(function($qq) use ($kw) {
                $qq->where('name', 'like', "%{$kw}%")
                   ->orWhere('phone', 'like', "%{$kw}%");
            });
        }
        if ($deg = $req->query('degree')) {
            $q->where('degree', $deg);
        }

        $per = (int) $req->query('per_page', 20);
        return $q->paginate($per);
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'name'   => 'required|string|max:120',
            'phone'  => 'required|string|max:20',
            'degree' => 'required|string|max:32', // NEW
        ]);

        $phone = $this->normalizeMaPhone($data['phone']);
        if (!$phone) {
            return response()->json(['message' => 'Invalid Moroccan phone (06/07… or +2126/7…)'], 422);
        }

        // (Optional) restrict to known degrees:
        // $allowed = ['degree1','degree2','degree3','degree4'];
        // if (!in_array($data['degree'], $allowed, true)) {
        //     return response()->json(['message' => 'Invalid degree'], 422);
        // }

        // Create or update by phone
        $user = User::updateOrCreate(
            ['phone' => $phone],
            [
                'name'   => $data['name'],
                'role'   => 'student',
                'degree' => $data['degree'], // NEW
                // 'email' can remain null
            ]
        );

        // 201 on create/update is fine for this admin action
        return response()->json($user->fresh(), 201);
    }

    public function destroy($id)
    {
        $u = User::findOrFail($id);
        $u->delete();
        return response()->json(['deleted' => true]);
    }

    /**
     * Normalize Moroccan phone to +2126/7XXXXXXXX
     */
    private function normalizeMaPhone(string $raw): ?string
    {
        $p = preg_replace('/[\s\-]/', '', $raw);

        if (preg_match('/^\+212[67]\d{8}$/', $p)) return $p;
        if (preg_match('/^212[67]\d{8}$/', $p))  return '+'.$p;
        if (preg_match('/^0[67]\d{8}$/', $p))   return '+212'.substr($p, 1);

        return null;
    }
}
