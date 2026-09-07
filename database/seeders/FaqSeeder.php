<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $membership = [
            ['question' => 'Is there a minimum commitment?', 'answer' => "No. All plans are month-to-month. Cancel anytime with 30 days' notice."],
            ['question' => 'Can I freeze my membership?', 'answer' => 'Yes — up to 3 months per year at no charge. Perfect for travel or recovery.'],
            ['question' => 'Do you offer corporate memberships?', 'answer' => 'We do. Volume pricing starts at 10 employees. Contact us for a proposal.'],
            ['question' => "What's included in the free trial?", 'answer' => 'Two full weeks of unlimited access, group classes, and one 1-on-1 coach consultation.'],
        ];

        $contact = [
            ['question' => 'How fast do you respond?', 'answer' => 'Within one business day, often within a few hours during club hours.'],
            ['question' => 'Can I visit without a membership?', 'answer' => 'Yes — free tours daily, and every new member gets a two-week free trial.'],
            ['question' => 'Do you accept corporate wellness plans?', 'answer' => 'We partner with select corporate wellness programs. Ask us for a list.'],
        ];

        foreach ($membership as $i => $f) {
            Faq::create($f + ['show_on_contact' => false, 'show_on_membership' => true, 'sort_order' => $i + 1]);
        }
        foreach ($contact as $i => $f) {
            Faq::create($f + ['show_on_contact' => true, 'show_on_membership' => false, 'sort_order' => $i + 1]);
        }
    }
}
