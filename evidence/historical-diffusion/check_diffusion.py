import json
from pathlib import Path

# Independent finite-volume discretization; does not use the analytical series.
samples = json.loads(Path(__file__).with_name('diffusion-samples.json').read_text())
n = 80
dx = 1 / n
checks = []
for sample in samples:
    tau = sample['tau']
    steps = int(tau / (.1 * dx * dx)) + 1
    dt = tau / steps
    c = [0.] * n
    for _ in range(steps):
        next_c = []
        for i in range(n):
            left = i * dx
            right = (i + 1) * dx
            vol = (right**3 - left**3) / 3
            lower = left**2 * (c[i] - c[i-1]) / dx if i else 0
            upper = right**2 * ((c[i+1] - c[i]) / dx if i < n-1 else 2 * (1-c[i]) / dx)
            next_c.append(c[i] + dt * (upper-lower) / vol)
        c = next_c
    expected = sample['values']
    error = max(abs(a-b) for a,b in zip(c, expected))
    assert error < .002, (sample['radius'], error)
    assert all(-1e-10 <= v <= 1+1e-10 for v in expected)
    assert all(a <= b+1e-10 for a,b in zip(expected,expected[1:]))
    checks.append({'radius_nm':sample['radius'], 'fourier_number':tau, 'max_absolute_error':round(error,7), 'reference':'80-shell finite-volume diffusion', 'passed':True})
assert samples[0]['values'][0] > samples[1]['values'][0] > samples[2]['values'][0]
assert [round(s['relativeTime'],2) for s in samples] == [.25,1.,4.]
print(json.dumps({'diffusion_checks': checks, 'radius_scaling': 'passed', 'physical_bounds':'passed', 'radial_monotonicity':'passed'}, indent=2))
