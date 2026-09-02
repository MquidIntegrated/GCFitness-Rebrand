<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stat extends Model
{
    protected $fillable = ['page', 'section', 'label', 'value', 'suffix', 'sort_order'];
}
