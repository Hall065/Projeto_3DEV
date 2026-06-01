<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Connect\AttendanceController;
use App\Http\Controllers\Api\Connect\AttendanceManageController;
use App\Http\Controllers\Api\Connect\ClassController;
use App\Http\Controllers\Api\Connect\ClassRosterController;
use App\Http\Controllers\Api\Connect\ContractController;
use App\Http\Controllers\Api\Connect\CourseController;
use App\Http\Controllers\Api\Connect\CourseRosterController;
use App\Http\Controllers\Api\Connect\DashboardController;
use App\Http\Controllers\Api\Connect\LocationController;
use App\Http\Controllers\Api\Connect\PersonController;
use App\Http\Controllers\Api\Connect\ProfileController;
use App\Http\Controllers\Api\Connect\ReportController;
use App\Http\Controllers\Api\Connect\SalaryController;
use App\Http\Controllers\Api\Connect\StudentController;
use App\Http\Controllers\Api\Connect\TeacherController;
use App\Http\Controllers\Api\Grid\DashboardController as GridDashboardController;
use App\Http\Controllers\Api\Grid\InventoryController as GridInventoryController;
use App\Http\Controllers\Api\Grid\TaskController as GridTaskController;
use App\Http\Controllers\Api\Grid\TicketController as GridTicketController;
use App\Http\Controllers\Api\Grid\UserController as GridUserController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\CustomReportController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\ReportPresetController;
use App\Http\Controllers\Api\SpreadsheetController;
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
        Route::put('/me', [AuthController::class, 'update']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/search', GlobalSearchController::class);

    Route::get('/applications', [ApplicationController::class, 'index']);

    Route::prefix('admin')->middleware('admin')->group(function (): void {
        Route::get('/roles', [UserManagementController::class, 'roles']);
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::put('/users/{user}', [UserManagementController::class, 'update']);
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy']);
    });

    Route::prefix('reports/{module}')->whereIn('module', ['connect', 'grid'])->group(function (): void {
        Route::get('/schema', [CustomReportController::class, 'schema']);
        Route::get('/filter-options', [CustomReportController::class, 'filterOptions']);
        Route::get('/presets', [ReportPresetController::class, 'index']);
        Route::post('/presets', [ReportPresetController::class, 'store']);
        Route::put('/presets/{preset}', [ReportPresetController::class, 'update']);
        Route::delete('/presets/{preset}', [ReportPresetController::class, 'destroy']);
        Route::post('/build', [CustomReportController::class, 'build']);
        Route::post('/export-csv', [CustomReportController::class, 'exportCsv']);
        Route::post('/export-html', [CustomReportController::class, 'exportHtml']);
    });

    Route::prefix('spreadsheets/{module}')->whereIn('module', ['connect', 'grid'])->group(function (): void {
        Route::get('/', [SpreadsheetController::class, 'index']);
        Route::get('/import-logs', [SpreadsheetController::class, 'logs']);
        Route::get('/{key}/template', [SpreadsheetController::class, 'template']);
        Route::get('/{key}/export', [SpreadsheetController::class, 'export']);
        Route::post('/{key}/preview', [SpreadsheetController::class, 'preview']);
        Route::post('/{key}/import', [SpreadsheetController::class, 'import']);
    });

    Route::prefix('connect')->middleware('permission:connect.access')->group(function (): void {
        Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:connect.dashboard');

        Route::middleware('permission:connect.people.manage')->group(function (): void {
            Route::get('/people/{person}/profile', [ProfileController::class, 'person']);
            Route::get('/people', [PersonController::class, 'index']);
            Route::post('/people', [PersonController::class, 'store']);
            Route::put('/people/{person}', [PersonController::class, 'update']);
            Route::delete('/people/{person}', [PersonController::class, 'destroy']);
        });

        Route::get('/students/{student}/profile', [ProfileController::class, 'student'])->middleware('permission:connect.students.view,connect.students.manage');
        Route::get('/students', [StudentController::class, 'index'])->middleware('permission:connect.students.view,connect.students.manage');
        Route::middleware('permission:connect.students.manage')->group(function (): void {
            Route::post('/students', [StudentController::class, 'store']);
            Route::put('/students/{student}', [StudentController::class, 'update']);
            Route::delete('/students/{student}', [StudentController::class, 'destroy']);
        });

        Route::middleware('permission:connect.teachers.manage')->group(function (): void {
            Route::get('/teachers/{teacher}/profile', [ProfileController::class, 'teacher']);
            Route::get('/teachers', [TeacherController::class, 'index']);
            Route::post('/teachers', [TeacherController::class, 'store']);
            Route::put('/teachers/{teacher}', [TeacherController::class, 'update']);
            Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']);
        });

        Route::get('/classes/{connectClass}/profile', [ProfileController::class, 'classProfile'])->middleware('permission:connect.classes.view,connect.classes.manage');
        Route::get('/classes', [ClassController::class, 'index'])->middleware('permission:connect.classes.view,connect.classes.manage');
        Route::middleware('permission:connect.classes.manage')->group(function (): void {
            Route::post('/classes', [ClassController::class, 'store']);
            Route::put('/classes/{connectClass}', [ClassController::class, 'update']);
            Route::delete('/classes/{connectClass}', [ClassController::class, 'destroy']);
            Route::get('/classes/{connectClass}/roster', [ClassRosterController::class, 'index']);
            Route::post('/classes/{connectClass}/roster', [ClassRosterController::class, 'store']);
            Route::delete('/classes/{connectClass}/roster/{person}', [ClassRosterController::class, 'destroy']);
        });

        Route::middleware('permission:connect.courses.manage')->group(function (): void {
            Route::get('/courses/{course}/profile', [ProfileController::class, 'course']);
            Route::get('/courses', [CourseController::class, 'index']);
            Route::post('/courses', [CourseController::class, 'store']);
            Route::put('/courses/{course}', [CourseController::class, 'update']);
            Route::get('/courses/{course}/roster', [CourseRosterController::class, 'index']);
            Route::post('/courses/{course}/roster', [CourseRosterController::class, 'store']);
            Route::delete('/courses/{course}/roster/{person}', [CourseRosterController::class, 'destroy']);
        });

        Route::get('/attendance/session', [AttendanceController::class, 'show'])->middleware('permission:connect.attendance.view,connect.attendance.view_own,connect.attendance.manage');
        Route::post('/attendance/sessions/{session}/marks', [AttendanceController::class, 'saveMarks'])->middleware('permission:connect.attendance.manage');
        Route::get('/attendance/records', [AttendanceManageController::class, 'index'])->middleware('permission:connect.attendance.view,connect.attendance.manage');

        Route::get('/reports/summary', [ReportController::class, 'summary'])->middleware('permission:connect.reports.view,connect.reports.manage');

        Route::get('/locations', [LocationController::class, 'index'])->middleware('permission:connect.location.view');

        Route::get('/contracts/{contract}/profile', [ProfileController::class, 'contract'])->middleware('permission:connect.contracts.manage');
        Route::middleware('permission:connect.contracts.manage')->group(function (): void {
            Route::get('/contracts', [ContractController::class, 'index']);
            Route::post('/contracts', [ContractController::class, 'store']);
            Route::put('/contracts/{contract}', [ContractController::class, 'update']);
            Route::delete('/contracts/{contract}', [ContractController::class, 'destroy']);
        });

        Route::get('/salaries', [SalaryController::class, 'index'])->middleware('admin');
        Route::post('/salaries/calculate', [SalaryController::class, 'calculate'])->middleware('admin');
    });

    Route::prefix('grid')->middleware('permission:grid.access')->group(function (): void {
        Route::get('/dashboard', [GridDashboardController::class, 'index'])->middleware('permission:grid.dashboard');

        Route::get('/tickets', [GridTicketController::class, 'index'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::get('/tickets/{ticket}', [GridTicketController::class, 'show'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::get('/tickets/{ticket}/report', [GridTicketController::class, 'report'])->middleware('permission:grid.reports.view');
        Route::post('/tickets', [GridTicketController::class, 'store'])->middleware('permission:grid.tickets.manage');
        Route::post('/tickets/{ticket}/tasks', [GridTicketController::class, 'createTask'])->middleware('permission:grid.tickets.manage');
        Route::post('/tickets/{ticket}/approve-service', [GridTicketController::class, 'approveService'])->middleware('permission:grid.tickets.manage');
        Route::post('/tickets/{ticket}/evaluate', [GridTicketController::class, 'evaluate'])->middleware('permission:grid.tickets.manage');
        Route::put('/tickets/{ticket}', [GridTicketController::class, 'update'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::delete('/tickets/{ticket}', [GridTicketController::class, 'destroy'])->middleware('permission:grid.tickets.manage');

        Route::get('/tasks', [GridTaskController::class, 'index'])->middleware('permission:grid.tasks.manage');
        Route::post('/tasks', [GridTaskController::class, 'store'])->middleware('permission:grid.tasks.manage');
        Route::put('/tasks/{task}', [GridTaskController::class, 'update'])->middleware('permission:grid.tasks.manage');
        Route::delete('/tasks/{task}', [GridTaskController::class, 'destroy'])->middleware('permission:grid.tasks.manage');

        Route::get('/inventory', [GridInventoryController::class, 'index'])->middleware('permission:grid.inventory.view,grid.inventory.manage');
        Route::middleware('permission:grid.inventory.manage')->group(function (): void {
            Route::post('/inventory', [GridInventoryController::class, 'store']);
            Route::put('/inventory/{inventoryItem}', [GridInventoryController::class, 'update']);
            Route::post('/inventory/{inventoryItem}/adjust', [GridInventoryController::class, 'adjust']);
            Route::post('/inventory/{inventoryItem}/sync-image', [GridInventoryController::class, 'syncImage']);
            Route::delete('/inventory/{inventoryItem}', [GridInventoryController::class, 'destroy']);
        });

        Route::middleware('permission:grid.users.manage')->group(function (): void {
            Route::get('/users', [GridUserController::class, 'index']);
            Route::post('/users', [GridUserController::class, 'store']);
            Route::put('/users/{gridUser}', [GridUserController::class, 'update']);
            Route::delete('/users/{gridUser}', [GridUserController::class, 'destroy']);
        });
    });
});
