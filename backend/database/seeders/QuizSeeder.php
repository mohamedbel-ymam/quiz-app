<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Question;
use App\Models\Answer;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'math' => [
                ['2 + 2 = ?', ['3'=>0,'4'=>1,'5'=>0,'6'=>0]],
                ['Dérivée de x^2 ?', ['2x'=>1,'x'=>0,'x^2'=>0,'1'=>0]],
            ],
            'physics' => [
                ['Unité SI de la force ?', ['Joule'=>0,'Newton'=>1,'Watt'=>0,'Pascal'=>0]],
                ['Vitesse de la lumière ~ ?', ['3e8 m/s'=>1,'3e6 m/s'=>0,'3e5 m/s'=>0,'3e7 m/s'=>0]],
            ],
            'cs' => [
                ['Complexité moyenne de la recherche binaire ?', ['O(n)'=>0,'O(log n)'=>1,'O(n log n)'=>0,'O(1)'=>0]],
                ['HTTP est…', ['Protocole'=>1,'Langage'=>0,'BD'=>0,'Système'=>0]],
            ],
            'language' => [
                ['Synonyme de “rapide” ?', ['lent'=>0,'vif'=>1,'immobile'=>0,'paisible'=>0]],
                ['Pluriel de “cheval” ?', ['chevals'=>0,'chevaux'=>1,'chevales'=>0,'cheveau'=>0]],
            ],
        ];

        foreach ($data as $subject => $qs) {
            foreach ($qs as [$text, $answers]) {
                $q = Question::create(['subject'=>$subject, 'text'=>$text]);
                foreach ($answers as $aText => $ok) {
                    Answer::create([
                        'question_id'=>$q->id,
                        'text'=>$aText,
                        'is_correct'=>(bool)$ok
                    ]);
                }
            }
        }
    }
}


