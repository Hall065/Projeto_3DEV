<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ApplicationSeeder::class,
            ApplicationPermissionSeeder::class,
            ConnectSeeder::class,
            GridSeeder::class,
            GridSampleTicketsSeeder::class,
        ]);
    }
}
