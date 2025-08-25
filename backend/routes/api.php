<?php 
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizFlowController;
use App\Http\Controllers\ResultsController;
use App\Http\Middleware\AdminKeyMiddleware;
use App\Http\Controllers\AdminQuestionController;
use App\Http\Controllers\AdminUserController;

Route::get('/questions', [QuestionController::class, 'index']);
Route::post('/submit',    [QuizController::class, 'submit']);
Route::post('/quiz/start', [QuizFlowController::class, 'start']);


Route::middleware(AdminKeyMiddleware::class)->group(function () {  
        Route::get('/admin/ping', fn(Request $r) => response()->json(['ok' => true]));

      Route::get('/results', [ResultsController::class, 'index']);
      Route::delete('/results/{id}', [ResultsController::class, 'destroy']);



    // list with pagination/filters (optional but handy)
    Route::get('/admin/questions', [AdminQuestionController::class, 'index']);
    // create
    Route::post('/admin/questions', [AdminQuestionController::class, 'store']);
    // update
    Route::put('/admin/questions/{id}', [AdminQuestionController::class, 'update']);
    // delete
    Route::delete('/admin/questions/{id}', [AdminQuestionController::class, 'destroy']);


    Route::get('/admin/users',  [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);
});