<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Result;
use App\Models\User;

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
     public function clearUserPhone($id)
    {
        $res = Result::findOrFail($id);
        $phone = $res->phone;

        // Si le résultat n’a pas de téléphone, on s’arrête proprement
        if (!$phone) {
            return response()->json([
                'ok' => false,
                'message' => "Aucun téléphone n'est enregistré dans ce résultat.",
            ], 400);
        }

        $user = User::where('phone', $phone)->first();

        if (!$user) {
            // Rien à effacer côté users, mais on renvoie le téléphone utilisé
            return response()->json([
                'ok' => true,
                'note' => "Aucun utilisateur ne possède actuellement ce téléphone.",
                'phone_cleared' => $phone,
            ], 200);
        }

        $user->phone = null;
        $user->save();

        return response()->json([
            'ok' => true,
            'phone_cleared' => $phone,
            'user_id' => $user->id,
        ], 200);
    }

    public function destroy($id)
    {
        $res = Result::findOrFail($id);
        $res->delete();
        return response()->json(['deleted' => true]);
    }
}
