<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Question;
use App\Models\Answer;

class AdminQuestionController extends Controller
{
    public function index(Request $req)
{
    $q = \App\Models\Question::query()->with('answers');
    if ($s = $req->query('subject')) $q->where('subject', $s);
    if ($d = $req->query('degree'))  $q->where('degree', $d);
    if ($k = $req->query('q'))       $q->where('text','like',"%{$k}%");
    return $q->orderByDesc('id')->paginate((int)$req->query('per_page', 20));
}

public function store(Request $req)
{
    $data = $req->validate([
        'degree'  => 'required|string|max:32',
        'subject' => 'required|string',
        'text'    => 'required|string',
        'answers' => 'required|array|min:2|max:6',
        'answers.*.text' => 'required|string',
        'answers.*.is_correct' => 'required|boolean',
    ]);

    if (collect($data['answers'])->where('is_correct', true)->count() !== 1) {
        return response()->json(['message'=>'Exactly one answer must be correct'], 422);
    }

    $q = \App\Models\Question::create([
        'degree'  => $data['degree'],
        'subject' => $data['subject'],
        'text'    => $data['text'],
    ]);

    foreach ($data['answers'] as $a) {
        \App\Models\Answer::create([
            'question_id' => $q->id,
            'text' => $a['text'],
            'is_correct' => (bool)$a['is_correct'],
        ]);
    }
    return \App\Models\Question::with('answers')->find($q->id);
}

public function update($id, Request $req)
{
    $data = $req->validate([
        'degree'  => 'sometimes|string|max:32',
        'subject' => 'sometimes|string',
        'text'    => 'sometimes|string',
        'answers' => 'sometimes|array|min:2|max:6',
        'answers.*.text' => 'required_with:answers|string',
        'answers.*.is_correct' => 'required_with:answers|boolean',
    ]);

    $q = \App\Models\Question::findOrFail($id);
    if (isset($data['degree']))  $q->degree  = $data['degree'];
    if (isset($data['subject'])) $q->subject = $data['subject'];
    if (isset($data['text']))    $q->text    = $data['text'];
    $q->save();

    if (isset($data['answers'])) {
        if (collect($data['answers'])->where('is_correct', true)->count() !== 1) {
            return response()->json(['message'=>'Exactly one answer must be correct'], 422);
        }
        \App\Models\Answer::where('question_id', $q->id)->delete();
        foreach ($data['answers'] as $a) {
            \App\Models\Answer::create([
                'question_id' => $q->id,
                'text' => $a['text'],
                'is_correct' => (bool)$a['is_correct'],
            ]);
        }
    }
    return \App\Models\Question::with('answers')->find($q->id);
}
    public function destroy($id)
    {
        // cascade if your FK is set to cascade; otherwise delete answers first
        Answer::where('question_id', $id)->delete();
        Question::where('id', $id)->delete();
        return response()->json(['deleted' => true]);
    }
}
