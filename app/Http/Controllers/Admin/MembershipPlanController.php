<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MembershipPlan;
use Illuminate\Http\Request;

class MembershipPlanController extends Controller
{
    public function index()
    {
        return inertia('Admin/MembershipPlans/Index', [
            'plans' => MembershipPlan::orderBy('sort_order')->get(['id', 'name', 'monthly_price', 'annual_price', 'popular']),
        ]);
    }

    public function create()
    {
        return inertia('Admin/MembershipPlans/Form', [
            'plan' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) MembershipPlan::max('sort_order') + 1;

        MembershipPlan::create($validated + ['sort_order' => $nextOrder]);

        return redirect()->route('admin.membership-plans.index');
    }

    public function edit(MembershipPlan $membershipPlan)
    {
        return inertia('Admin/MembershipPlans/Form', [
            'plan' => $membershipPlan->only(['id', 'name', 'monthly_price', 'annual_price', 'popular', 'home_features', 'features']),
        ]);
    }

    public function update(Request $request, MembershipPlan $membershipPlan)
    {
        $validated = $this->validated($request);

        $membershipPlan->update($validated);

        return redirect()->route('admin.membership-plans.index');
    }

    public function destroy(MembershipPlan $membershipPlan)
    {
        $membershipPlan->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'monthly_price' => ['required', 'integer', 'min:0'],
            'annual_price' => ['required', 'integer', 'min:0'],
            'popular' => ['required', 'boolean'],
            'home_features' => ['required', 'array', 'min:1'],
            'home_features.*' => ['string'],
            'features' => ['required', 'array', 'min:1'],
            'features.*' => ['string'],
        ]);
    }
}
