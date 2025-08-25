<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Result;

class ResultsController extends Controller
{
    public function index(Request $request)
    {
        $q = Result::query()->orderByDesc('id');

        if ($student = $request->query('student')) {
            $q->where('student_name', 'like', "%{$student}%");
        }
        if ($subject = $request->query('subject')) {
            $q->where('subject', $subject);
        }
        if ($degree = $request->query('degree')) {
            $q->where('degree', $degree);
        }
        if ($phone = $request->query('phone')) {
            $q->where('phone', 'like', "%{$phone}%");
        }

        $per = (int) $request->query('per_page', 20);
        return $q->paginate($per);
    }

    public function destroy($id)
    {
        $res = Result::findOrFail($id);
        $res->delete();
        return response()->json(['deleted' => true]);
    }
}
