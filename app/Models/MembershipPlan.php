<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipPlan extends Model
{
    protected $fillable = [
        'name',
        'monthly_price',
        'annual_price',
        'popular',
        'home_features',
        'features',
        'sort_order',
    ];

    protected $casts = [
        'popular' => 'boolean',
        'home_features' => 'array',
        'features' => 'array',
    ];
}
