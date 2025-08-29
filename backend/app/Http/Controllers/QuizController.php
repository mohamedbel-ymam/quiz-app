<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Result;
use App\Models\Answer;
use Illuminate\Support\Facades\Cache;

class QuizController extends Controller
{
    /**
     * POST /api/submit
     * Payload example:
     * {
     *   "student_name": "Alice",
     *   "student_phone": "06XXXXXXXX",
     *   "degree": "degree1",
     *   "subject": "math",
     *   "answers": [
     *     {"question_id": 12, "answer_id": 45, "time_spent": 9},
     *     {"question_id": 13, "answer_id": null}
     *   ],
     *   "total": 10,
     *   "duration": 732
     * }
     */
    public function submit(Request $request)
    {
        $data = $request->validate([
            'student_name'             => 'required|string|max:255',
            'student_phone'            => 'required|string|max:32',
            'degree'                   => 'nullable|string|max:64',
            'subject'                  => 'nullable|string|max:255',
            'answers'                  => 'array',
            'answers.*.question_id'    => 'required|integer',
            'answers.*.answer_id'      => 'nullable|integer', // allow unanswered
            'answers.*.time_spent'     => 'nullable|integer|min:0',
            'total'                    => 'nullable|integer|min:0',
            'duration'                 => 'required|integer|min:0',
        ]);

        // Normalize phone to +212 format
        $phone = $this->normalizeMaPhone($data['student_phone']);
        if (!$phone) {
            return response()->json(['message' => 'Invalid Moroccan phone'], 422);
        }

        // Friendly block if already submitted
        if (Result::where('phone', $phone)->exists()) {
            return response()->json([
                'error'   => 'already_taken',
                'message' => 'You have already submitted this quiz.'
            ], 409);
        }

        $answers = collect($data['answers'] ?? []);

        // Score: only count provided answers; missing/null => incorrect
        $providedAnswerIds = $answers
            ->pluck('answer_id')
            ->filter()               // remove nulls
            ->values()
            ->all();

        $correctById = [];
        if (!empty($providedAnswerIds)) {
            $correctById = Answer::whereIn('id', $providedAnswerIds)
                ->pluck('is_correct', 'id')
                ->toArray();
        }

        $score = 0;
        foreach ($answers as $row) {
            $aid = $row['answer_id'] ?? null;
            if ($aid && !empty($correctById[$aid])) {
                $score++;
            }
        }

        // Total questions shown to the student
        // Prefer client-sent total (bundle size). Fallback = number of distinct answered question_ids
        $total = $data['total'] ?? $answers->pluck('question_id')->unique()->count();

        $result = Result::create([
            'student_name' => $data['student_name'],
            'phone'        => $phone,
            'subject'      => $data['subject'] ?? null,
            'degree'       => $data['degree'] ?? null,
            'score'        => $score,
            'total'        => (int) $total,
            'duration'     => (int) $data['duration'],
        ]);
        Cache::forever("quiz_lock:$phone", 1);


        return response()->json([
            'result_id' => $result->id,
            'score'     => $score,
            'total'     => (int) $total,
            'duration'  => (int) $data['duration'],
            'percent'   => $total > 0 ? round($score * 100 / $total) : 0
        ], 201);
    }

    /**
     * Optional: GET /api/results/{id}
     */
    public function show($id)
    {
        $res = Result::findOrFail($id);
        return response()->json($res);
    }
    
    public function destroy($id) {
    $res = Result::findOrFail($id);
    $phone = $res->phone;
    $res->delete();
    Cache::forget("quiz_lock:$phone"); // allow new attempt
    return response()->json(['deleted'=>true]);
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

        if (preg_match('/^\+212[67]\d{8}$/', $p)) return $p;               // +2126/7XXXXXXXX
        if (preg_match('/^212[67]\d{8}$/',  $p)) return '+'.$p;            // 2126/7XXXXXXXX
        if (preg_match('/^0[67]\d{8}$/',    $p)) return '+212'.substr($p, 1); // 06/07XXXXXXXX

        return null;
    }
}
