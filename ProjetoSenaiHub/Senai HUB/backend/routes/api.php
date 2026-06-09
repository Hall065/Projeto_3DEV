<?php

use App\Http\Controllers\Api\AccessRequestController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Connect\AttendanceController;
use App\Http\Controllers\Api\Connect\CampusMapController;
use App\Http\Controllers\Api\Connect\CalendarController;
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
use App\Http\Controllers\Api\Safe\AuthorizationController as SafeAuthorizationController;
use App\Http\Controllers\Api\Safe\DashboardController as SafeDashboardController;
use App\Http\Controllers\Api\Safe\PortariaController as SafePortariaController;
use App\Http\Controllers\Api\Safe\StudentController as SafeStudentController;
use App\Http\Controllers\Api\Safe\TeacherController as SafeTeacherController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\CustomReportController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\PublicConfigController;
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
Route::get('/public-config', [PublicConfigController::class, 'index']);

Route::post('/access-requests', [AccessRequestController::class, 'store'])->middleware('throttle:5,1');

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/permissions-catalog', [AuthController::class, 'permissionsCatalog']);
        Route::put('/me', [AuthController::class, 'update']);
        Route::post('/avatar', [AuthController::class, 'updateAvatar']);
        Route::delete('/avatar', [AuthController::class, 'deleteAvatar']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::get('/notification-preferences', [NotificationController::class, 'preferences']);
        Route::put('/notification-preferences', [NotificationController::class, 'updatePreferences']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/search', GlobalSearchController::class);

    Route::prefix('notifications')->group(function (): void {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('/{notification}/read', [NotificationController::class, 'markRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
    });

    Route::get('/applications', [ApplicationController::class, 'index']);

    Route::prefix('admin')->middleware('admin')->group(function (): void {
        Route::get('/roles', [UserManagementController::class, 'roles']);
        Route::get('/nav-permissions', [UserManagementController::class, 'navPermissions']);
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::get('/users/{user}', [UserManagementController::class, 'show']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::put('/users/{user}', [UserManagementController::class, 'update']);
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy']);
    });

    Route::prefix('reports/{module}')->whereIn('module', ['connect', 'grid'])->group(function (): void {
        Route::get('/schema', [CustomReportController::class, 'schema'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::get('/filter-options', [CustomReportController::class, 'filterOptions'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::get('/presets', [ReportPresetController::class, 'index'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::post('/presets', [ReportPresetController::class, 'store'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::put('/presets/{preset}', [ReportPresetController::class, 'update'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::delete('/presets/{preset}', [ReportPresetController::class, 'destroy'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::post('/build', [CustomReportController::class, 'build'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::post('/export-csv', [CustomReportController::class, 'exportCsv'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::post('/export-xlsx', [CustomReportController::class, 'exportXlsx'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::post('/export-json', [CustomReportController::class, 'exportJson'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
        Route::post('/export-html', [CustomReportController::class, 'exportHtml'])
            ->middleware('permission:connect.reports.view,connect.reports.manage,grid.reports.view');
    });

    Route::prefix('spreadsheets/{module}')->whereIn('module', ['connect', 'grid'])->group(function (): void {
        Route::get('/', [SpreadsheetController::class, 'index'])
            ->middleware('permission:connect.spreadsheets,grid.spreadsheets');
        Route::get('/import-logs', [SpreadsheetController::class, 'logs'])
            ->middleware('permission:connect.spreadsheets,grid.spreadsheets');
        Route::get('/{key}/template', [SpreadsheetController::class, 'template'])
            ->middleware('permission:connect.spreadsheets,grid.spreadsheets');
        Route::get('/{key}/export', [SpreadsheetController::class, 'export'])
            ->middleware('permission:connect.spreadsheets,grid.spreadsheets');
        Route::post('/{key}/preview', [SpreadsheetController::class, 'preview'])
            ->middleware('permission:connect.spreadsheets,grid.spreadsheets');
        Route::post('/{key}/import', [SpreadsheetController::class, 'import'])
            ->middleware('permission:connect.spreadsheets,grid.spreadsheets');
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

        Route::get('/teachers/{teacher}/profile', [ProfileController::class, 'teacher'])->middleware('permission:connect.teachers.view,connect.teachers.manage');
        Route::get('/teachers', [TeacherController::class, 'index'])->middleware('permission:connect.teachers.view,connect.teachers.manage');
        Route::middleware('permission:connect.teachers.manage')->group(function (): void {
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

        Route::get('/courses/{course}/profile', [ProfileController::class, 'course'])->middleware('permission:connect.courses.view,connect.courses.manage');
        Route::get('/courses', [CourseController::class, 'index'])->middleware('permission:connect.courses.view,connect.courses.manage');
        Route::middleware('permission:connect.courses.manage')->group(function (): void {
            Route::post('/courses', [CourseController::class, 'store']);
            Route::put('/courses/{course}', [CourseController::class, 'update']);
            Route::get('/courses/{course}/roster', [CourseRosterController::class, 'index']);
            Route::post('/courses/{course}/roster', [CourseRosterController::class, 'store']);
            Route::delete('/courses/{course}/roster/{person}', [CourseRosterController::class, 'destroy']);
        });

        Route::get('/calendar', [CalendarController::class, 'index'])->middleware('permission:connect.calendar.view,connect.calendar.manage');
        Route::get('/calendar/semesters', [CalendarController::class, 'semesters'])->middleware('permission:connect.calendar.view,connect.calendar.manage');
        Route::get('/classes/{connectClass}/weekly-patterns', [CalendarController::class, 'weeklyPatterns'])->middleware('permission:connect.calendar.view,connect.calendar.manage,connect.classes.view,connect.classes.manage');
        Route::get('/classes/{connectClass}/schedule-plan', [CalendarController::class, 'schedulePlan'])->middleware('permission:connect.calendar.view,connect.calendar.manage,connect.classes.view,connect.classes.manage');
        Route::middleware('permission:connect.calendar.manage,connect.classes.manage')->group(function (): void {
            Route::post('/calendar/lessons', [CalendarController::class, 'storeLesson']);
            Route::put('/calendar/lessons/{connectLessonSchedule}', [CalendarController::class, 'updateLesson']);
            Route::delete('/calendar/lessons/{connectLessonSchedule}', [CalendarController::class, 'destroyLesson']);
            Route::put('/classes/{connectClass}/weekly-patterns', [CalendarController::class, 'syncWeeklyPatterns']);
            Route::post('/classes/{connectClass}/generate-schedule', [CalendarController::class, 'generateSchedule']);
            Route::post('/classes/{connectClass}/provision-attendance', [CalendarController::class, 'provisionAttendance']);
        });

        Route::get('/attendance/session', [AttendanceController::class, 'show'])->middleware('permission:connect.attendance.view,connect.attendance.view_own,connect.attendance.manage');
        Route::post('/attendance/sessions/{session}/marks', [AttendanceController::class, 'saveMarks'])->middleware('permission:connect.attendance.manage');
        Route::get('/attendance/records', [AttendanceManageController::class, 'index'])->middleware('permission:connect.attendance.view,connect.attendance.manage');
        Route::get('/attendance/class-summary', [AttendanceManageController::class, 'classSummary'])->middleware('permission:connect.attendance.view,connect.attendance.manage');
        Route::get('/attendance/student-summary', [AttendanceManageController::class, 'studentSummary'])->middleware('permission:connect.attendance.view,connect.attendance.manage');

        Route::get('/reports/summary', [ReportController::class, 'summary'])->middleware('permission:connect.reports.view,connect.reports.manage');
        Route::get('/reports/summary/xlsx', [ReportController::class, 'summaryXlsx'])->middleware('permission:connect.reports.view,connect.reports.manage');

        Route::get('/locations', [LocationController::class, 'index'])->middleware('permission:connect.location.view');
        Route::get('/campus-people', [CampusMapController::class, 'people'])->middleware('permission:connect.location.view');

        Route::get('/contracts/{contract}/profile', [ProfileController::class, 'contract'])->middleware('permission:connect.contracts.view,connect.contracts.view_own,connect.contracts.manage');
        Route::get('/contracts', [ContractController::class, 'index'])->middleware('permission:connect.contracts.view,connect.contracts.view_own,connect.contracts.manage');
        Route::middleware('permission:connect.contracts.manage')->group(function (): void {
            Route::post('/contracts', [ContractController::class, 'store']);
            Route::put('/contracts/{contract}', [ContractController::class, 'update']);
            Route::delete('/contracts/{contract}', [ContractController::class, 'destroy']);
        });

        Route::get('/salaries', [SalaryController::class, 'index'])->middleware('permission:connect.salary.view,connect.salary.view_own');
        Route::get('/salaries/preview', [SalaryController::class, 'preview'])->middleware('permission:connect.salary.view,connect.salary.view_own');
        Route::post('/salaries/calculate', [SalaryController::class, 'calculate'])->middleware('admin');
        Route::post('/salaries/calculate-batch', [SalaryController::class, 'calculateBatch'])->middleware('admin');
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
        Route::post('/tickets/{ticket}/attachments', [GridTicketController::class, 'storeAttachment'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::delete('/tickets/{ticket}/attachments/{gridTicketAttachment}', [GridTicketController::class, 'destroyAttachment'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::delete('/tickets/{ticket}', [GridTicketController::class, 'destroy'])->middleware('permission:grid.tickets.manage');

        Route::get('/tasks', [GridTaskController::class, 'index'])->middleware('permission:grid.tasks.manage');
        Route::post('/tasks', [GridTaskController::class, 'store'])->middleware('permission:grid.tasks.manage');
        Route::put('/tasks/{task}', [GridTaskController::class, 'update'])->middleware('permission:grid.tasks.manage');
        Route::delete('/tasks/{task}', [GridTaskController::class, 'destroy'])->middleware('permission:grid.tasks.manage');

        Route::get('/inventory', [GridInventoryController::class, 'index'])->middleware('permission:grid.inventory.view,grid.inventory.manage');
        Route::get('/inventory/{inventoryItem}', [GridInventoryController::class, 'show'])->middleware('permission:grid.inventory.view,grid.inventory.manage');
        Route::middleware('permission:grid.inventory.manage')->group(function (): void {
            Route::post('/inventory', [GridInventoryController::class, 'store']);
            Route::put('/inventory/{inventoryItem}', [GridInventoryController::class, 'update']);
            Route::post('/inventory/{inventoryItem}/adjust', [GridInventoryController::class, 'adjust']);
            Route::post('/inventory/{inventoryItem}/sync-image', [GridInventoryController::class, 'syncImage']);
            Route::post('/inventory/{inventoryItem}/image', [GridInventoryController::class, 'uploadImage']);
            Route::delete('/inventory/{inventoryItem}', [GridInventoryController::class, 'destroy']);
        });

        Route::middleware('permission:grid.users.manage')->group(function (): void {
            Route::get('/users', [GridUserController::class, 'index']);
            Route::get('/users/{gridUser}', [GridUserController::class, 'show']);
            Route::post('/users', [GridUserController::class, 'store']);
            Route::put('/users/{gridUser}', [GridUserController::class, 'update']);
            Route::delete('/users/{gridUser}', [GridUserController::class, 'destroy']);
        });
    });

    Route::prefix('safe')->middleware('permission:safe.access')->group(function (): void {
        Route::get('/dashboard', [SafeDashboardController::class, 'index'])->middleware('permission:safe.dashboard');

        Route::middleware('permission:safe.students.manage')->group(function (): void {
            Route::get('/students', [SafeStudentController::class, 'index']);
            Route::post('/students', [SafeStudentController::class, 'store']);
            Route::get('/students/{safeStudent}', [SafeStudentController::class, 'show']);
            Route::put('/students/{safeStudent}', [SafeStudentController::class, 'update']);
            Route::delete('/students/{safeStudent}', [SafeStudentController::class, 'destroy']);
        });

        Route::middleware('permission:safe.authorizations.manage')->group(function (): void {
            Route::get('/authorizations', [SafeAuthorizationController::class, 'index']);
            Route::post('/authorizations', [SafeAuthorizationController::class, 'store']);
            Route::get('/authorizations/{safeAuthorization}', [SafeAuthorizationController::class, 'show']);
            Route::put('/authorizations/{safeAuthorization}', [SafeAuthorizationController::class, 'update']);
            Route::get('/authorizations/{safeAuthorization}/history', [SafeAuthorizationController::class, 'history']);
        });

        Route::prefix('teacher')->middleware('permission:safe.approve')->group(function (): void {
            Route::get('/authorizations', [SafeTeacherController::class, 'index']);
            Route::post('/authorizations/{safeAuthorization}/approve', [SafeTeacherController::class, 'approve']);
            Route::post('/authorizations/{safeAuthorization}/deny', [SafeTeacherController::class, 'deny']);
        });

        Route::prefix('portaria')->middleware('permission:safe.portaria')->group(function (): void {
            Route::get('/authorizations', [SafePortariaController::class, 'index']);
            Route::post('/authorizations/{safeAuthorization}/confirm', [SafePortariaController::class, 'confirm']);
            Route::post('/authorizations/{safeAuthorization}/deny', [SafePortariaController::class, 'deny']);
        });
    });
});
