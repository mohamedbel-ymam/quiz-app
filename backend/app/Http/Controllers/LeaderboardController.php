<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Result;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeaderboardController extends Controller
{
    // GET /api/admin/leaderboard?degree=first_degree&min_percent=0&subject=math
    public function index(Request $request)
    {
        $data = $request->validate([
            'degree'      => 'nullable|string|max:64',           // allow null/all
            'min_percent' => 'nullable|integer|min:0|max:100',
            'subject'     => 'nullable|string|max:255',
        ]);

        $degreeInput    = $data['degree'] ?? null;              // e.g., 'first_degree', 'all', null
        $degreeResolved = $this->normalizeDegree($degreeInput); // e.g., 'degree1' or null for all

        $q = Result::query();
        if ($degreeResolved) {
            $q->where('degree', $degreeResolved);
        }
        if (!empty($data['subject'])) {
            $q->where('subject', $data['subject']);
        }

        $results = $q->select(['student_name','phone','score','total','duration','subject','degree','created_at'])
            ->orderByDesc('score')
            ->orderBy('duration')     // same score -> faster first
            ->orderBy('created_at')   // tie-breaker
            ->get()
            ->map(function($r, $i){
                $percent = $r->total > 0 ? round($r->score * 100 / $r->total) : 0;
                return [
                    'rank'        => $i + 1,
                    'student_name'=> $r->student_name,
                    'phone'       => $r->phone,
                    'score'       => (int)$r->score,
                    'total'       => (int)$r->total,
                    'percent'     => $percent,
                    'duration_s'  => (int)$r->duration,
                    'subject'     => $r->subject,
                    'degree'      => $r->degree,
                    'date'        => optional($r->created_at)->toDateTimeString(),
                ];
            });

        // optional pass filter
        if (isset($data['min_percent'])) {
            $min = (int)$data['min_percent'];
            $results = $results->filter(fn($row) => $row['percent'] >= $min)->values();
            // re-rank after filtering
            $results = $results->values()->map(function($row, $i){
                $row['rank'] = $i + 1;
                return $row;
            });
        }

        return response()->json([
            'degree_input'   => $degreeInput,
            'degree_resolved'=> $degreeResolved ?? 'all',
            'count'          => $results->count(),
            'results'        => $results,
        ]);
    }

    // GET /api/admin/leaderboard/export?degree=first_degree&min_percent=0&subject=math
    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'degree'      => 'nullable|string|max:64',           // allow null/all
            'min_percent' => 'nullable|integer|min:0|max:100',
            'subject'     => 'nullable|string|max:255',
        ]);

        $degreeInput    = $data['degree'] ?? null;
        $degreeResolved = $this->normalizeDegree($degreeInput);

        $q = Result::query();
        if ($degreeResolved) {
            $q->where('degree', $degreeResolved);
        }
        if (!empty($data['subject'])) {
            $q->where('subject', $data['subject']);
        }

        $rows = $q->select(['student_name','phone','score','total','duration','subject','degree','created_at'])
            ->orderByDesc('score')
            ->orderBy('duration')
            ->orderBy('created_at')
            ->get()
            ->map(function($r, $i){
                $percent = $r->total > 0 ? round($r->score * 100 / $r->total) : 0;
                return [
                    'rank'        => $i + 1,
                    'student_name'=> $r->student_name,
                    'phone'       => $r->phone,
                    'score'       => (int)$r->score,
                    'total'       => (int)$r->total,
                    'percent'     => $percent,
                    'duration_s'  => (int)$r->duration,
                    'subject'     => $r->subject,
                    'degree'      => $r->degree,
                    'date'        => optional($r->created_at)->toDateTimeString(),
                ];
            });

        if (isset($data['min_percent'])) {
            $min = (int)$data['min_percent'];
            $rows = $rows->filter(fn($row) => $row['percent'] >= $min)->values();
            $rows = $rows->values()->map(function($row, $i){
                $row['rank'] = $i + 1;
                return $row;
            });
        }

        $suffix   = $degreeResolved ?? 'all';
        $filename = 'leaderboard_'.$suffix.'_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function() use ($rows) {
            $out = fopen('php://output', 'w');
            // UTF-8 BOM for Excel
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, ['Rang','Nom','Téléphone','Score','Total','%','Durée(s)','Matière','Niveau','Date']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r['rank'], $r['student_name'], $r['phone'], $r['score'], $r['total'],
                    $r['percent'], $r['duration_s'], $r['subject'], $r['degree'], $r['date']
                ]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Map front-end degree aliases to stored values (or null for "all"/empty).
     * Adjust freely to your schema.
     */
    private function normalizeDegree(?string $in): ?string
    {
        if (!$in || $in === 'all') return null;

        $alias = [
            'first_degree'   => 'degree1',
            'second_degree'  => 'degree2',
            'third_degree'   => 'degree3',
            'fourth_degree'  => 'degree4',
            // tes choix spécifiques :
            '4eme'           => 'degree1',
            '5eme'           => 'degree2',
            '6eme'           => 'degree3',
            'Bac'            => 'degree4',
        ];

        return $alias[$in] ?? $in; // if already like 'degree1', keep it
    }
}
