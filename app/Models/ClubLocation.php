<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubLocation extends Model
{
    protected $fillable = ['name', 'address', 'hours', 'sort_order'];
}
