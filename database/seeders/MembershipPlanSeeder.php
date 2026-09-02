<?php

namespace Database\Seeders;

use App\Models\MembershipPlan;
use Illuminate\Database\Seeder;

class MembershipPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Essential',
                'monthly_price' => 85,
                'annual_price' => 72,
                'popular' => false,
                'home_features' => ['Unlimited Club Access', 'Standard Locker', 'Biometric Entry', 'Mobile App'],
                'features' => ['Unlimited Club Access', 'Standard Locker', 'Biometric Entry', 'Mobile App', 'Group Classes (5/mo)'],
            ],
            [
                'name' => 'Performance',
                'monthly_price' => 140,
                'annual_price' => 119,
                'popular' => true,
                'home_features' => ['Everything in Essential', 'Weekly Master Classes', 'Recovery Zone', 'Coach Portal', '2 Guest Passes / mo'],
                'features' => ['Everything in Essential', 'Unlimited Group Classes', 'Recovery Zone (Sauna, Cryo)', 'Coach Portal', 'Guest Passes (2/mo)', 'Nutrition Consultation'],
            ],
            [
                'name' => 'Elite',
                'monthly_price' => 290,
                'annual_price' => 247,
                'popular' => false,
                'home_features' => ['Everything in Performance', '1-on-1 Nutritionist', 'Priority Booking', 'Private Locker & Laundry', 'Concierge Support'],
                'features' => ['Everything in Performance', '1-on-1 Nutritionist', '4× Personal Training / mo', 'Priority Booking', 'Private Locker & Laundry', 'Concierge Support'],
            ],
        ];

        foreach ($plans as $i => $plan) {
            MembershipPlan::create($plan + ['sort_order' => $i + 1]);
        }
    }
}
