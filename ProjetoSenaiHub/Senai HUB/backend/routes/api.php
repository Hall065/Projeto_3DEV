<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Connect\AttendanceController;
use App\Http\Controllers\Api\Connect\AttendanceManageController;
use App\Http\Controllers\Api\Connect\ClassController;
use App\Http\Controllers\Api\Connect\ContractController;
use App\Http\Controllers\Api\Connect\CourseController;
use App\Http\Controllers\Api\Connect\DashboardController;
use App\Http\Controllers\Api\Connect\LocationController;
use App\Http\Controllers\Api\Connect\ReportController;
use App\Http\Controllers\Api\Connect\SalaryController;
use App\Http\Controllers\Api\Connect\StudentController;
use App\Http\Controllers\Api\Connect\TeacherController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — SENAI HUB
|--------------------------------------------------------------------------
|
| Rotas públicas e protegidas da API REST.
| O frontend React consome exclusivamente estes endpoints.
|
*/

Route::get('/health', [HealthController::class, 'index']);

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/applications', [ApplicationController::class, 'index']);

    Route::prefix('connect')->group(function (): void {
        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/students', [StudentController::class, 'index']);
        Route::post('/students', [StudentController::class, 'store']);

        Route::get('/teachers', [TeacherController::class, 'index']);
        Route::post('/teachers', [TeacherController::class, 'store']);

        Route::get('/classes', [ClassController::class, 'index']);
        Route::post('/classes', [ClassController::class, 'store']);

        Route::get('/courses', [CourseController::class, 'index']);
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);

        Route::get('/attendance/session', [AttendanceController::class, 'show']);
        Route::post('/attendance/sessions/{session}/marks', [AttendanceController::class, 'saveMarks']);

        Route::get('/attendance/records', [AttendanceManageController::class, 'index']);

        Route::get('/reports/summary', [ReportController::class, 'summary']);

        Route::get('/locations', [LocationController::class, 'index']);

        Route::get('/contracts', [ContractController::class, 'index']);
        Route::post('/contracts', [ContractController::class, 'store']);

        Route::get('/salaries', [SalaryController::class, 'index']);
        Route::post('/salaries/calculate', [SalaryController::class, 'calculate']);
    });
});
