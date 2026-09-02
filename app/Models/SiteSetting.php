<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['address_line1', 'address_line2', 'phone', 'email', 'hours'];
}
