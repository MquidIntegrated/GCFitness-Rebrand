<?php

namespace Database\Seeders;

use App\Models\SocialLink;
use Illuminate\Database\Seeder;

class SocialLinkSeeder extends Seeder
{
    public function run(): void
    {
        $links = [
            ['platform' => 'Instagram', 'url' => 'https://instagram.com/gcfitness'],
            ['platform' => 'Facebook', 'url' => 'https://facebook.com/gcfitness'],
            ['platform' => 'TikTok', 'url' => 'https://tiktok.com/@gcfitness'],
        ];

        foreach ($links as $i => $link) {
            SocialLink::create($link + ['logo_path' => '/images/placeholder-image.svg', 'sort_order' => $i + 1]);
        }
    }
}
