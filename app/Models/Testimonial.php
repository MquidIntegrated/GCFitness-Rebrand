<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    protected $fillable = ['quote', 'name', 'role', 'show_on_home', 'show_on_about', 'sort_order'];

    protected $casts = [
        'show_on_home' => 'boolean',
        'show_on_about' => 'boolean',
    ];
}
