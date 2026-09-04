<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'image', 'max:5120'],
            'type' => ['required', 'string', 'in:social-link,partner,program,trainer'],
        ]);

        $path = $validated['file']->store('uploads/' . $validated['type'], 'public');

        return response()->json(['url' => Storage::url($path)]);
    }
}
