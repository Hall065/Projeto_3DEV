<?php

return [
    'action' => [
        'open' => 'Open in app',
    ],

    'hub.user.created' => [
        'title' => 'SENAI HUB account created',
        'message' => 'Your access has been configured. Sign in and review your available modules.',
    ],
    'hub.user.created_admin' => [
        'title' => 'New user registered',
        'message' => ':name (:email) was added to the system.',
    ],
    'hub.user.role_updated' => [
        'title' => 'Access profile updated',
        'message' => 'Your permissions or role were changed by an administrator.',
    ],
    'hub.auth.password_changed' => [
        'title' => 'Password changed',
        'message' => 'Your password was updated successfully. If this was not you, contact an administrator.',
    ],
    'hub.access_request' => [
        'title' => 'New access request',
        'message' => ':summary',
    ],

    'connect.student.enrolled' => [
        'title' => 'Enrollment confirmed',
        'message' => 'You were enrolled in class :className.',
    ],
    'connect.student.enrolled_teacher' => [
        'title' => 'New student in class',
        'message' => ':studentName joined class :className.',
    ],
    'connect.student.enrolled_staff' => [
        'title' => 'Student enrolled',
        'message' => ':studentName registered :classSuffix.',
    ],
    'connect.class.teacher_assigned' => [
        'title' => 'Class assigned to you',
        'message' => 'You were set as teacher for class :className.',
    ],
    'connect.class.updated' => [
        'title' => 'Class updated',
        'message' => 'Class :className had teacher or course updated.',
    ],
    'connect.course.roster_added' => [
        'title' => 'Course enrollment',
        'message' => 'You were added to course :courseName as :role.',
    ],
    'connect.calendar.lesson_scheduled' => [
        'title' => 'Lesson scheduled — :className',
        'message' => 'Lesson on :date from :startTime to :endTime — :subject.',
    ],
    'connect.calendar.lesson_cancelled' => [
        'title' => 'Lesson cancelled',
        'message' => 'The lesson on :date for class :className was cancelled.',
    ],
    'connect.calendar.schedule_generated' => [
        'title' => 'Calendar updated',
        'message' => ':count lesson(s) generated for class :className.',
    ],
    'connect.attendance.high_absence' => [
        'title' => 'High absence rate',
        'message' => 'Roll call :date for class :classCode: :absentRate% absences.',
    ],
    'connect.attendance.limit_warning' => [
        'title' => 'Absence limit warning',
        'message' => ':remaining absence(s) remaining for class :className.',
    ],
    'connect.contract.created' => [
        'title' => 'New contract registered',
        'message' => 'Contract with :companyName registered in the system.',
    ],
    'connect.contract.created_staff' => [
        'title' => 'Contract registered',
        'message' => 'Contract for :studentName with :companyName.',
    ],

    'grid.ticket.created' => [
        'title' => 'New ticket:urgentSuffix',
        'message' => ':code: :title — requester :requester.',
    ],
    'grid.ticket.assigned' => [
        'title' => 'Ticket assigned to you',
        'message' => ':code: :title',
    ],
    'grid.ticket.status_changed' => [
        'title' => 'Ticket status changed',
        'message' => ':code is now :status.',
    ],
    'grid.ticket.status_requester' => [
        'title' => 'Your ticket was updated',
        'message' => ':code: :title — status :status.',
    ],
    'grid.ticket.awaiting_evaluation' => [
        'title' => 'Ticket awaiting your evaluation',
        'message' => ':code: :title',
    ],
    'grid.task.assigned' => [
        'title' => 'Task assigned to you',
        'message' => ':code: :title',
    ],
    'grid.task.completed' => [
        'title' => 'Task completed',
        'message' => ':code: :title',
    ],
    'grid.inventory.low_stock' => [
        'title' => 'Low stock',
        'message' => ':itemTitle: :qtyAvailable available (minimum :qtyMin).',
    ],

    'spreadsheet.import_finished' => [
        'title' => ':successTitle',
        'message' => ':spreadsheetKey: :processed record(s) processed:errorSuffix',
    ],
];
