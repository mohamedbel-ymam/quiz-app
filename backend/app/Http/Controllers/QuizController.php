<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Answer;
use App\Models\Result;
use App\Models\User;
use Illuminate\Database\QueryException;

class QuizController extends Controller
{
    // POST /api/submit
    // payload: {
    //   student_name, student_phone, subject, degree?,
    //   answers: [{question_id, answer_id, time_spent}],
    //   duration
    // }
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'student_name'            => 'required|string|max:100',
            'student_phone'           => 'required|string|max:20',
            'subject'                 => 'required|string',
            'degree'                  => 'nullable|string|max:32',
            'answers'                 => 'required|array|min:1',
            'answers.*.question_id'   => 'required|integer|exists:questions,id',
            'answers.*.answer_id'     => 'required|integer|exists:answers,id',
            'answers.*.time_spent'    => 'required|integer|min:0', // seconds on that question
            'duration'                => 'required|integer|min:0|max:900',
        ]);

        // Normalize Moroccan phone (same rules as in QuizFlowController)
        $phone = $this->normalizeMaPhone($validated['student_phone']);
        if (!$phone) {
            return response()->json(['message' => 'Invalid Moroccan phone'], 422);
        }

        // Optional: derive degree from user to prevent tampering (recommended)
        // If you prefer trusting the client value, keep $degree = $validated['degree'] ?? null;
        $degree = $validated['degree'] ?? null;
        if (!$degree) {
            $user = User::where('phone', $phone)->first();
            $degree = $user?->degree; // could still be null if not set
        }

        // Server-side guard — one lifetime attempt per phone
        // If you want "one per degree", change this to:
        // Result::where('phone', $phone)->where('degree', $degree)->exists()
        if (Result::where('phone', $phone)->exists()) {
            return response()->json(['message' => 'Quiz already submitted'], 409);
        }

        // Compute score
        $score = 0;
        $total = count($validated['answers']);
        $perQuestion = [];

        foreach ($validated['answers'] as $pair) {
            $isCorrect = Answer::where('id', $pair['answer_id'])
                ->where('question_id', $pair['question_id'])
                ->value('is_correct');

            $correct = (bool) $isCorrect;
            if ($correct) $score++;

            $perQuestion[] = [
                'question_id' => (int) $pair['question_id'],
                'answer_id'   => (int) $pair['answer_id'],
                'correct'     => $correct,
                'time_spent'  => (int) $pair['time_spent'],
            ];
        }

        try {
            $res = Result::create([
                'student_name' => $validated['student_name'],
                'subject'      => $validated['subject'],
                'phone'        => $phone,          // 👈 required for one-attempt rule
                'degree'       => $degree,         // 👈 helpful for reporting/per-degree rule
                'score'        => $score,
                'total'        => $total,
                'duration'     => (int) $validated['duration'],
                'details'      => [
                    'per_question'  => $perQuestion,
                    'total_seconds' => (int) $validated['duration'],
                ],
            ]);
        } catch (QueryException $e) {
            // If you added a UNIQUE index on results.phone (or phone+degree),
            // a retry/duplicate will be caught here too.
            return response()->json(['message' => 'Quiz already submitted'], 409);
        }

        return response()->json([
            'result_id' => $res->id,
            'score'     => $score,
            'total'     => $total,
            'percent'   => $total > 0 ? round(($score * 100) / $total) : 0,
            'details'   => $res->details,
        ]);
    }

    /**
     * Normalize Moroccan phone numbers to E.164 +212 format.
     * Accepts:
     *  - 06XXXXXXXX / 07XXXXXXXX
     *  - +2126XXXXXXXX / +2127XXXXXXXX
     *  - 2126XXXXXXXX / 2127XXXXXXXX
     * Strips spaces/dashes. Returns "+2126/7XXXXXXXX" or null if invalid.
     */
    private function normalizeMaPhone(string $raw): ?string
    {
        $p = preg_replace('/[\s\-]/', '', $raw);

        if (preg_match('/^\+212[67]\d{8}$/', $p)) return $p;         // +2126/7XXXXXXXX
        if (preg_match('/^212[67]\d{8}$/',  $p)) return '+'.$p;      // 2126/7XXXXXXXX
        if (preg_match('/^0[67]\d{8}$/',   $p)) return '+212'.substr($p, 1); // 06/07XXXXXXXX

        return null;
    }
}
