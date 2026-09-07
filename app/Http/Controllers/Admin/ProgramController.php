<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function index()
    {
        return inertia('Admin/Programs/Index', [
            'programs' => Program::orderBy('sort_order')->get([
                'id', 'title', 'tag', 'duration', 'level', 'description', 'home_description', 'image_path', 'featured',
            ]),
        ]);
    }

    public function create()
    {
        return inertia('Admin/Programs/Form', [
            'program' => null,
            'readOnly' => false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Program::max('sort_order') + 1;

        Program::create($validated + ['sort_order' => $nextOrder]);

        return redirect()->route('admin.programs.index');
    }

    public function edit(Request $request, Program $program)
    {
        return inertia('Admin/Programs/Form', [
            'program' => $program->only(['id', 'title', 'tag', 'duration', 'level', 'description', 'home_description', 'image_path', 'featured']),
            'readOnly' => $request->query('mode') === 'view',
        ]);
    }

    public function update(Request $request, Program $program)
    {
        $validated = $this->validated($request);

        $program->update($validated);

        return redirect()->route('admin.programs.index');
    }

    public function destroy(Program $program)
    {
        $program->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'string', 'max:255'],
            'duration' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'home_description' => ['required', 'string'],
            'image_path' => ['required', 'string', 'max:255'],
            'featured' => ['required', 'boolean'],
        ]);
    }
}
