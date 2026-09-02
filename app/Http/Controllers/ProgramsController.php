<?php

namespace App\Http\Controllers;

use App\Models\Program;

class ProgramsController extends Controller
{
    public function index()
    {
        return inertia('Programs', [
            'programs' => Program::orderBy('sort_order')->get(['title', 'tag', 'duration', 'level', 'description', 'image_path']),
        ]);
    }
}
