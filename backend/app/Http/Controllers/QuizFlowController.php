<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Question;
use App\Models\Result;
use Illuminate\Support\Facades\Cache;

class QuizFlowController extends Controller
{
    /**
     * POST /api/quiz/start
     * payload: { name, phone, subjects?: string[], per_subject?: int }
     *
     * Rules enforced here:
     * - Only pre-registered students (phone must belong to a User)
     * - One lifetime attempt (by phone) until admin deletes their Result
     * - Returns a randomized bundle of questions filtered by student's degree
     */
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
        if (Cache::has("quiz_lock:$normalized")) {
            return response()->json([
                'error' => 'already_taken',
                'message' => 'Vous avez déjà passé ce quiz.'
            ], 409);
        }
        if (!$normalized) {
            return response()->json(['message' => 'Invalid Moroccan phone'], 422);
        }

        // ✅ Only allow pre-registered students (existing users)
        $user = User::where('phone', $normalized)->first();
        if (!$user) {
            return response()->json(['message' => 'Phone not authorized'], 403);
        }

        // ❗ One-lifetime attempt guard (by normalized phone)
        if (Result::where('phone', $normalized)->exists()) {
            return response()->json([
                'error'   => 'already_taken',
                'message' => 'Vous avez déjà passé ce quiz.'
  
            ], 409);
        }

        // Keep latest display name if it changed
        if ($user->name !== $data['name']) {
            $user->name = $data['name'];
            $user->save();
        }

        // Degree comes from the user (adapt this to your schema if needed)
        // If you store a relation, e.g. $user->degree->code, adjust accordingly.
        $degree   = $user->degree ?? 'degree1';

        // Subjects to pull from (optional in payload -> default set)
        $subjects = $data['subjects'] ?? ['math', 'physics', 'cs', 'language'];
        $per      = $data['per_subject'] ?? 5;

        // Build a randomized bundle filtered by degree
        $bundle = [];
        foreach ($subjects as $subj) {
            $qs = Question::with('answers')
                ->where('degree', $degree)       // 👈 filter per student's degree
                ->where('subject', $subj)
                ->inRandomOrder()
                ->limit($per)
                ->get()
                ->map(function ($q) use ($subj, $degree) {
                    return [
                        'id'      => $q->id,
                        'degree'  => $degree,
                        'subject' => $subj,
                        'text'    => $q->text,
                        'answers' => $q->answers->map(fn ($a) => [
                            'id'   => $a->id,
                            'text' => $a->text,
                        ])->values()->all(),
                    ];
                })->all();

            $bundle = array_merge($bundle, $qs);
        }

        if (count($bundle) === 0) {
            return response()->json([
                'message' => 'No questions available for your degree. Please contact the admin.',
            ], 404);
        }

        shuffle($bundle);

        return response()->json([
            'user_id'      => $user->id,
            'degree'       => $degree,
            'questions'    => $bundle,
            'subjects'     => $subjects,
            'per_subject'  => $per,
            'phone'        => $normalized,
        ], 200);
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

        if (preg_match('/^\+212[67]\d{8}$/', $p)) return $p;             // +2126/7XXXXXXXX
        if (preg_match('/^212[67]\d{8}$/',  $p)) return '+'.$p;          // 2126/7XXXXXXXX
        if (preg_match('/^0[67]\d{8}$/',   $p)) return '+212'.substr($p, 1); // 06/07XXXXXXXX

        return null;
        }
}
