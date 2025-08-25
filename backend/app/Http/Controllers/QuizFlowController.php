<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Question;
use App\Models\Result;

class QuizFlowController extends Controller
{
    // POST /api/quiz/start
    // payload: { name, phone, subjects?: [...], per_subject?: 5 }
    public function start(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:120',
            'phone'       => 'required|string|max:20',
            'subjects'    => 'array',
            'subjects.*'  => 'string',
            'per_subject' => 'integer|min:1|max:50',
        ]);

        // Normalize Moroccan phone to +212 format
        $normalized = $this->normalizeMaPhone($data['phone']);
        if (!$normalized) {
            return response()->json(['message' => 'Invalid Moroccan phone'], 422);
        }

        // ✅ Only allow pre-registered students (existing users)
        $user = User::where('phone', $normalized)->first();
        if (!$user) {
            return response()->json(['message' => 'Phone not authorized'], 403);
        }

        // ❗ One-lifetime attempt guard (by phone)
        $already = Result::where('phone', $normalized)->exists();
        if ($already) {
            return response()->json(['message' => 'Quiz already taken'], 409); // 409 Conflict
        }

        // Keep latest display name if changed
        if ($user->name !== $data['name']) {
            $user->name = $data['name'];
            $user->save();
        }

        // Degree comes from the user
        $degree   = $user->degree ?? 'degree1';
        $subjects = $data['subjects'] ?? ['math','physics','cs','language'];
        $per      = $data['per_subject'] ?? 5;

        // Build questions bundle filtered by degree
        $bundle = [];
        foreach ($subjects as $subj) {
            $qs = Question::with('answers')
                ->where('degree', $degree)   // 👈 filter by student's degree
                ->where('subject', $subj)
                ->inRandomOrder()
                ->limit($per)
                ->get()
                ->map(function($q) use ($subj, $degree){
                    return [
                        'id'      => $q->id,
                        'degree'  => $degree,
                        'subject' => $subj,
                        'text'    => $q->text,
                        'answers' => $q->answers->map(fn($a)=>[
                            'id'   => $a->id,
                            'text' => $a->text,
                        ])->values()->all(),
                    ];
                })->all();

            $bundle = array_merge($bundle, $qs);
        }

        // If nothing found for this degree, tell the admin/student clearly
        if (count($bundle) === 0) {
            return response()->json([
                'message' => 'No questions available for your degree. Please contact the admin.',
            ], 404);
        }

        shuffle($bundle);

        return response()->json([
            'user_id'      => $user->id,
            'degree'       => $degree,        // 👈 return degree so frontend can display/save
            'questions'    => $bundle,
            'subjects'     => $subjects,
            'per_subject'  => $per,
            'phone'        => $normalized,
        ]);
    }

    /**
     * Normalize Moroccan phone numbers to E.164 +212 format.
     * Accepts:
     *  - 06XXXXXXXX / 07XXXXXXXX (10 digits)
     *  - +2126XXXXXXXX / +2127XXXXXXXX
     *  - 2126XXXXXXXX / 2127XXXXXXXX
     *  - Allows spaces/dashes which are stripped.
     * Returns "+2126/7XXXXXXXX" or null if invalid.
     */
    private function normalizeMaPhone(string $raw): ?string
    {
        $p = preg_replace('/[\s\-]/', '', $raw);

        if (preg_match('/^\+212[67]\d{8}$/', $p)) return $p;  // +2126/7XXXXXXXX
        if (preg_match('/^212[67]\d{8}$/',  $p)) return '+'.$p; // 2126/7XXXXXXXX
        if (preg_match('/^0[67]\d{8}$/',   $p)) return '+212'.substr($p, 1); // 06/07XXXXXXXX

        return null;
    }
}
