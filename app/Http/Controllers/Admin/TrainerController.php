<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trainer;
use Illuminate\Http\Request;

class TrainerController extends Controller
{
    public function index()
    {
        return inertia('Admin/Trainers/Index', [
            'trainers' => Trainer::orderBy('sort_order')->get([
                'id', 'name', 'specialty', 'years_experience', 'bio', 'certifications', 'image_path',
            ]),
        ]);
    }

    public function create()
    {
        return inertia('Admin/Trainers/Form', [
            'trainer' => null,
            'readOnly' => false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Trainer::max('sort_order') + 1;

        Trainer::create($validated + ['sort_order' => $nextOrder]);

        return redirect()->route('admin.trainers.index');
    }

    public function edit(Request $request, Trainer $trainer)
    {
        return inertia('Admin/Trainers/Form', [
            'trainer' => $trainer->only(['id', 'name', 'specialty', 'years_experience', 'bio', 'certifications', 'image_path']),
            'readOnly' => $request->query('mode') === 'view',
        ]);
    }

    public function update(Request $request, Trainer $trainer)
    {
        $validated = $this->validated($request);

        $trainer->update($validated);

        return redirect()->route('admin.trainers.index');
    }

    public function destroy(Trainer $trainer)
    {
        $trainer->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'specialty' => ['required', 'string', 'max:255'],
            'years_experience' => ['required', 'string', 'max:255'],
            'bio' => ['required', 'string'],
            'certifications' => ['required', 'array', 'min:1'],
            'certifications.*' => ['string'],
            'image_path' => ['required', 'string', 'max:255'],
        ]);
    }
}
