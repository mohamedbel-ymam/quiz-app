<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizFlowController;
use App\Http\Controllers\ResultsController;
use App\Http\Controllers\AdminQuestionController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\AdminSecurityController;
use App\Http\Middleware\AdminKeyMiddleware;

// Public endpoints
Route::get('/questions', [QuestionController::class, 'index']);
Route::post('/submit',    [QuizController::class, 'submit']);
Route::post('/quiz/start', [QuizFlowController::class, 'start']);

// Admin-protected endpoints
Route::middleware([AdminKeyMiddleware::class])->group(function () {

    // Health / auth check (rate-limited)
    Route::get('/admin/ping', [AdminSecurityController::class, 'ping'])
        ->middleware('throttle:admin-login');

    // Rotate admin key (rate-limited)
    Route::post('/admin/admin-key', [AdminSecurityController::class, 'rotate'])
        ->middleware('throttle:admin-rotate');

    // Results
    Route::get('/results', [ResultsController::class, 'index']);
    Route::delete('/results/{id}', [ResultsController::class, 'destroy']);
    Route::post('/admin/results/{id}/clear-user-phone', [ResultsController::class, 'clearUserPhone']);

    // Questions CRUD
    Route::get('/admin/questions',    [AdminQuestionController::class, 'index']);
    Route::post('/admin/questions',   [AdminQuestionController::class, 'store']);
    Route::put('/admin/questions/{id}', [AdminQuestionController::class, 'update']);
    Route::delete('/admin/questions/{id}', [AdminQuestionController::class, 'destroy']);

    // Users
    Route::get('/admin/users',  [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);

    // Leaderboard
    Route::get('/admin/leaderboard',          [LeaderboardController::class, 'index']);
    Route::get('/admin/leaderboard/export',   [LeaderboardController::class, 'export']);
});
