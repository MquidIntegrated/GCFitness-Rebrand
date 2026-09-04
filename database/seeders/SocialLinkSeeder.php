<?php

namespace Database\Seeders;

use App\Models\SocialLink;
use Illuminate\Database\Seeder;

class SocialLinkSeeder extends Seeder
{
    public function run(): void
    {
        $links = [
            ['platform' => 'Instagram', 'url' => 'https://instagram.com/gcfitness', 'icon_slug' => 'instagram'],
            ['platform' => 'Facebook', 'url' => 'https://facebook.com/gcfitness', 'icon_slug' => 'facebook'],
            ['platform' => 'TikTok', 'url' => 'https://tiktok.com/@gcfitness', 'icon_slug' => 'tiktok'],
        ];

        foreach ($links as $i => $link) {
            SocialLink::create($link + ['sort_order' => $i + 1]);
        }
    }
}
