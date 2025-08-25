<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Question;

class QuestionController extends Controller
{
    // GET /api/questions?subject=math&limit=10
    public function index(Request $request)
    {
        $subject = $request->query('subject');
        $limit = (int)($request->query('limit', 10));

        abort_if(!$subject, 400, 'subject is required');

        $questions = Question::with('answers')
            ->where('subject', $subject)
            ->inRandomOrder()
            ->limit($limit)
            ->get();

        return response()->json($questions);
    }
}
