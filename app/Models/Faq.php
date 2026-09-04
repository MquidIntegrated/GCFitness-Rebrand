<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    protected $fillable = ['question', 'answer', 'show_on_contact', 'show_on_membership', 'sort_order'];

    protected $casts = [
        'show_on_contact' => 'boolean',
        'show_on_membership' => 'boolean',
    ];
}
