"""Periodic lithium insertion and removal in one spherical particle.

Constant-D diffusion in a sphere, nondimensional (x = r/R, tau = Dt/R^2).
The surface concentration switches smoothly between 1 (insertion) and
0 (removal) every half period. The film shows the periodic steady state,
so its last frame joins its first without a jump.

Writes field.json: c(x, frame) on a radial grid for every film frame, the
surface value, the average fill, and the radii of the 20/40/60/80 % contours.
"""
import json, math, sys
import numpy as np

trapz = getattr(np, 'trapezoid', None) or np.trapz

FPS = 24
FRAMES = 384                  # 16 s loop at 24 fps
HALF = FRAMES // 2           # 8 s in, 8 s out
TAU_HALF = 0.40              # Fourier number per half period
RAMP = 12                    # surface switch takes 0.5 s, smoothed
NODES = 401                  # radial nodes, x = 0..1
SUB = 50                     # Crank-Nicolson substeps per frame
OUT_X = 256                  # radial samples written per frame
LEVELS = (0.2, 0.4, 0.6, 0.8)

def surface(frame_f):
    """Surface concentration at a (fractional) film frame."""
    f = frame_f % FRAMES
    into = f < HALF
    s = min(1.0, (f % HALF) / RAMP)
    s = s * s * (3 - 2 * s)
    return s if into else 1 - s

def solve(cycles=6):
    # u = x c obeys u_t = u_xx with u(0)=0 and u(1)=c_s.
    x = np.linspace(0, 1, NODES)
    h = x[1] - x[0]
    dt = TAU_HALF / HALF / SUB
    n = NODES - 2
    r = dt / h ** 2
    A = (np.diag(np.full(n, 1 + r)) + np.diag(np.full(n - 1, -r / 2), 1)
         + np.diag(np.full(n - 1, -r / 2), -1))
    B = (np.diag(np.full(n, 1 - r)) + np.diag(np.full(n - 1, r / 2), 1)
         + np.diag(np.full(n - 1, r / 2), -1))
    Ainv = np.linalg.inv(A)
    u = np.zeros(NODES)
    frames = []
    for cycle in range(cycles):
        record = []
        for f in range(FRAMES):
            record.append(u.copy())
            for k in range(SUB):
                t0 = f + k / SUB
                t1 = f + (k + 1) / SUB
                b0, b1 = surface(t0), surface(t1)
                rhs = B @ u[1:-1]
                rhs[-1] += r / 2 * (b0 + b1)
                u[1:-1] = Ainv @ rhs
                u[-1] = b1
        frames = record
    c = []
    for uf in frames:
        cf = np.empty_like(uf)
        cf[1:] = uf[1:] / x[1:]
        cf[0] = (4 * cf[1] - cf[2]) / 3    # symmetric centre, second order
        c.append(cf)
    return x, np.array(c)

def analytic(x, tau, terms=200):
    s = 0
    for n in range(1, terms + 1):
        rad = math.pi if x == 0 else math.sin(n * math.pi * x) / (n * x)
        s += (-1) ** (n + 1) * rad * math.exp(-n * n * math.pi ** 2 * tau)
    return 1 - 2 * s / math.pi

def check_against_analytic():
    """Step change on an empty sphere must match the series solution."""
    x = np.linspace(0, 1, NODES); h = x[1] - x[0]
    dt = 2e-5; n = NODES - 2; r = dt / h ** 2
    A = (np.diag(np.full(n, 1 + r)) + np.diag(np.full(n - 1, -r / 2), 1) + np.diag(np.full(n - 1, -r / 2), -1))
    B = (np.diag(np.full(n, 1 - r)) + np.diag(np.full(n - 1, r / 2), 1) + np.diag(np.full(n - 1, r / 2), -1))
    Ainv = np.linalg.inv(A)
    u = np.zeros(NODES); u[-1] = 1
    worst = 0
    for step in range(1, int(0.4 / dt) + 1):
        rhs = B @ u[1:-1]; rhs[-1] += r
        u[1:-1] = Ainv @ rhs
        tau = step * dt
        if step % 2000 == 0 and tau >= 0.04:
            for xi in (0.0, 0.25, 0.5, 0.75):
                i = int(round(xi * (NODES - 1)))
                c = (4 * u[1] / x[1] - u[2] / x[2]) / 3 if i == 0 else u[i] / x[i]
                worst = max(worst, abs(c - analytic(xi, tau)))
    return worst

if __name__ == '__main__':
    err = check_against_analytic()
    print(f'step-change check vs series solution: max |error| = {err:.2e}')
    assert err < 2e-3, err
    x, c = solve()
    # Periodicity: the frame after the last must equal the first.
    _, c2 = solve(cycles=7)
    drift = float(np.abs(c2 - c).max())
    print(f'cycle-to-cycle drift = {drift:.2e}')
    assert drift < 1e-4
    xs = np.linspace(0, 1, OUT_X)
    table = np.array([np.interp(xs, x, cf) for cf in c]).clip(0, 1)
    fill = [float(trapz(3 * x ** 2 * cf, x)) for cf in c]
    levels = []
    for cf in c:
        row = []
        for L in LEVELS:
            # c(x) is monotone in x within one frame except near the switch;
            # take the outermost crossing, or -1 when the level is absent.
            cross = -1.0
            for i in range(NODES - 1, 0, -1):
                a, b = cf[i - 1], cf[i]
                if (a - L) * (b - L) <= 0 and a != b:
                    cross = float(x[i - 1] + (L - a) / (b - a) * (x[i] - x[i - 1]))
                    break
            row.append(cross)
        levels.append(row)
    out = {
        'fps': FPS, 'frames': FRAMES, 'half': HALF, 'tauHalf': TAU_HALF,
        'radialSamples': OUT_X, 'levels': LEVELS,
        'surface': [round(surface(f), 4) for f in range(FRAMES)],
        'fill': [round(v, 4) for v in fill],
        'contours': [[round(v, 4) for v in row] for row in levels],
        'c': [[round(float(v), 4) for v in row] for row in table],
    }
    path = sys.argv[1] if len(sys.argv) > 1 else 'field.json'
    with open(path, 'w') as fh:
        json.dump(out, fh, separators=(',', ':'))
    print('fill range', min(fill), max(fill), 'centre range', table[:, 0].min(), table[:, 0].max())
