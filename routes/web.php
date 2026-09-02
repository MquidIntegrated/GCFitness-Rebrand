<?php

use App\Http\Controllers\PostController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return inertia('Home', ['name' => 'Mike']);
// });
Route::get('/', [PostController::class, 'index']);

Route::resource('posts', PostController::class)->except('index');
