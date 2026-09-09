<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClubLocation;
use App\Models\Faq;
use App\Models\MembershipPlan;
use App\Models\Partner;
use App\Models\Program;
use App\Models\Testimonial;
use App\Models\Trainer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    /**
     * The 7 content resources tracked by the dashboard's recent-activity
     * feed and 14-day trend — matches COUNT_META below and the source
     * app's own dashboard scope exactly (SiteSetting/SocialLink excluded).
     */
    private const TRACKED_RESOURCES = [
        ['model' => Program::class, 'label' => 'program', 'name_column' => 'title', 'count_key' => 'programs'],
        ['model' => Trainer::class, 'label' => 'trainer', 'name_column' => 'name', 'count_key' => 'trainers'],
        ['model' => MembershipPlan::class, 'label' => 'membership plan', 'name_column' => 'name', 'count_key' => 'membershipPlans'],
        ['model' => Partner::class, 'label' => 'partner', 'name_column' => 'name', 'count_key' => 'partners'],
        ['model' => ClubLocation::class, 'label' => 'location', 'name_column' => 'name', 'count_key' => 'locations'],
        ['model' => Testimonial::class, 'label' => 'testimonial', 'name_column' => 'name', 'count_key' => 'testimonials'],
        ['model' => Faq::class, 'label' => 'FAQ', 'name_column' => 'question', 'count_key' => 'faqs'],
    ];

    public function index()
    {
        return inertia('Admin/Dashboard', [
            'counts' => $this->counts(),
            'recentActivity' => $this->recentActivity(),
            'activityByDay' => $this->activityByDay(),
        ]);
    }

    /**
     * Derives counts from the same TRACKED_RESOURCES table recentActivity()
     * and activityByDay() already use, rather than a second hand-written
     * list — the two can no longer drift apart.
     */
    private function counts(): array
    {
        return collect(self::TRACKED_RESOURCES)
            ->mapWithKeys(fn ($resource) => [$resource['count_key'] => $resource['model']::count()])
            ->all();
    }

    /**
     * Most-recently-updated rows across all 7 tracked resources, newest
     * first, capped at 5. "Added" vs "Updated" is derived by comparing
     * created_at to updated_at (equal ⇒ never touched since creation)
     * rather than a separate audit log — see Global Constraints.
     */
    private function recentActivity(): array
    {
        $rows = collect();

        foreach (self::TRACKED_RESOURCES as $resource) {
            $rows = $rows->merge(
                $resource['model']::query()
                    ->latest('updated_at')
                    ->take(5)
                    ->get(['id', $resource['name_column'], 'created_at', 'updated_at'])
                    ->map(fn ($row) => [
                        'id' => $resource['label'].'-'.$row->id,
                        'description' => ($row->created_at->equalTo($row->updated_at) ? 'Added ' : 'Updated ')
                            .$resource['label'].': '.Str::limit($row->{$resource['name_column']}, 40),
                        'timestamp' => $row->updated_at,
                    ])
            );
        }

        return $rows->sortByDesc('timestamp')->take(5)->values()->all();
    }

    /**
     * Exactly 14 entries, oldest first, ending today — a real count of how
     * many tracked-resource rows were updated on each day, replacing the
     * source app's hand-written fixture trend.
     */
    private function activityByDay(): array
    {
        $start = Carbon::today()->subDays(13);

        $counts = collect(range(0, 13))
            ->mapWithKeys(fn ($i) => [$start->copy()->addDays($i)->toDateString() => 0]);

        foreach (self::TRACKED_RESOURCES as $resource) {
            $resource['model']::query()
                ->where('updated_at', '>=', $start)
                ->get(['updated_at'])
                ->each(function ($row) use (&$counts) {
                    $date = $row->updated_at->toDateString();
                    if ($counts->has($date)) {
                        $counts[$date] = $counts[$date] + 1;
                    }
                });
        }

        return $counts->map(fn ($count, $date) => ['date' => $date, 'count' => $count])->values()->all();
    }
}
