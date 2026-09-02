<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trainer extends Model
{
    protected $fillable = [
        'name',
        'specialty',
        'years_experience',
        'bio',
        'certifications',
        'image_path',
        'sort_order',
    ];

    protected $casts = [
        'certifications' => 'array',
    ];
}
