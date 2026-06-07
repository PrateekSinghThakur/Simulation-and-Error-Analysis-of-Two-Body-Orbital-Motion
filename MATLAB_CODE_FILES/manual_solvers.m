function [varargout] = manual_solvers(solver_type, t_span, S0, mu, h, varargin)
% MANUAL_SOLVERS Implements four numerical integration methods from scratch
%
% USAGE:
%   [t, S, E, L] = manual_solvers('euler', t_span, S0, mu, h)
%   [t, S, E, L] = manual_solvers('rk4', t_span, S0, mu, h)
%   [t, S, E, L] = manual_solvers('pc', t_span, S0, mu, h)
%   [t, S, E, L] = manual_solvers('ode45', t_span, S0, mu, h_max)
%
% METHODS IMPLEMENTED:
%   'euler'   - Explicit Euler method (O(h) local, O(h) global)
%   'rk4'     - Runge-Kutta 4th order (O(h⁵) local, O(h⁴) global)
%   'pc'      - Predictor-Corrector (Adams-Bashforth-Moulton, O(h³) local, O(h²) global)
%   'ode45'   - MATLAB's adaptive RK45 (reference solution)
%
% INPUTS:
%   solver_type - String specifying which method to use
%   t_span      - [t_initial, t_final] time integration interval
%   S0          - [x0, y0, vx0, vy0] initial state (row or column vector)
%   mu          - Gravitational parameter (scalar, typically 1.0)
%   h           - Step size for fixed-step methods OR max step for ode45
%
% OUTPUTS:
%   t    - Time vector (column vector)
%   S    - Solution matrix (N × 4), where N = number of steps
%          Each row: [x, y, vx, vy] at time t(i)
%   E    - Specific energy at each time step (column vector)
%   L    - Angular momentum magnitude at each step (column vector)
%
% AUTHOR: Numerical Methods Course
% DATE: 2024

% =========================================================================
% INPUT VALIDATION & SETUP
% =========================================================================

% Ensure S0 is column vector
if size(S0, 2) == 4 && size(S0, 1) == 1
    S0 = S0';
elseif size(S0, 1) == 4 && size(S0, 2) == 1
    % Already correct
else
    error('S0 must be a 4-element vector [x, y, vx, vy]');
end

% Validate time span
if t_span(1) >= t_span(2)
    error('t_span(2) must be greater than t_span(1)');
end

% Ensure mu is positive
if mu <= 0
    error('mu (gravitational parameter) must be positive');
end

% Route to appropriate solver
switch lower(solver_type)
    case 'euler'
        [t, S, E, L] = euler_solver(t_span, S0, mu, h);
    case 'rk4'
        [t, S, E, L] = rk4_solver(t_span, S0, mu, h);
    case 'pc'
        [t, S, E, L] = predictor_corrector_solver(t_span, S0, mu, h);
    case 'ode45'
        [t, S, E, L] = ode45_solver(t_span, S0, mu, h);
    otherwise
        error('Unknown solver type: %s. Use ''euler'', ''rk4'', ''pc'', or ''ode45''.', solver_type);
end

% Return arguments
varargout{1} = t;
varargout{2} = S;
varargout{3} = E;
varargout{4} = L;

end

% =========================================================================
% METHOD 1: EXPLICIT EULER (First-Order, O(h))
% =========================================================================

function [t, S, E, L] = euler_solver(t_span, S0, mu, h)
% EULER_SOLVER Explicit Euler method
%
% ALGORITHM:
%   S_{n+1} = S_n + h·f(t_n, S_n)
%
% where f(t, S) = two_body_ode(t, S, mu)
%
% CHARACTERISTICS:
%   Local truncation error:  O(h²)
%   Global truncation error: O(h)   [Error accumulates linearly]
%   Stability: Stable for h < 2/λ_max (where λ_max is max eigenvalue)
%   Accuracy: Poor; mainly educational value
%
% PROS:  Simple, one function evaluation per step
% CONS:  Inaccurate, unstable for large h, energy drift accumulates

t0 = t_span(1);
tf = t_span(2);

% Compute number of steps
N = round((tf - t0) / h) + 1;
h_actual = (tf - t0) / (N - 1);  % Adjust h for exact final time

% Pre-allocate arrays
t = linspace(t0, tf, N)';
S = zeros(N, 4);
E = zeros(N, 1);
L = zeros(N, 1);

% Set initial condition
S(1, :) = S0';
E(1) = compute_energy(S(1, :), mu);
L(1) = compute_angular_momentum(S(1, :));

% Integration loop
for n = 1:N-1
    % Compute derivative at current state
    dSdt = two_body_ode(t(n), S(n, :), mu);
    
    % Euler step: S_{n+1} = S_n + h·dSdt
    S(n+1, :) = S(n, :) + h_actual * dSdt';
    
    % Compute invariants at new state
    E(n+1) = compute_energy(S(n+1, :), mu);
    L(n+1) = compute_angular_momentum(S(n+1, :));
end

end

% =========================================================================
% METHOD 2: RUNGE-KUTTA 4TH ORDER (Fourth-Order, O(h⁴))
% =========================================================================

function [t, S, E, L] = rk4_solver(t_span, S0, mu, h)
% RK4_SOLVER Classical Runge-Kutta 4th order method
%
% ALGORITHM:
%   k1 = h·f(t_n, S_n)
%   k2 = h·f(t_n + h/2, S_n + k1/2)
%   k3 = h·f(t_n + h/2, S_n + k2/2)
%   k4 = h·f(t_n + h, S_n + k3)
%   
%   S_{n+1} = S_n + (k1 + 2k2 + 2k3 + k4)/6
%
% CHARACTERISTICS:
%   Local truncation error:  O(h⁵)
%   Global truncation error: O(h⁴)   [Superb accuracy]
%   Stability: Better than Euler; stable for larger h
%   Function evaluations: 4 per step
%
% PROS:  Excellent accuracy, stable, widely used in practice
% CONS:  4× more expensive than Euler per step
%
% PHYSICAL INSIGHT:
%   Weighted average of slopes at:
%   - Start of interval (k1)
%   - Two mid-points (k2, k3) [main contribution due to factor of 2]
%   - End of interval (k4)

t0 = t_span(1);
tf = t_span(2);

% Compute number of steps
N = round((tf - t0) / h) + 1;
h_actual = (tf - t0) / (N - 1);

% Pre-allocate arrays
t = linspace(t0, tf, N)';
S = zeros(N, 4);
E = zeros(N, 1);
L = zeros(N, 1);

% Set initial condition
S(1, :) = S0';
E(1) = compute_energy(S(1, :), mu);
L(1) = compute_angular_momentum(S(1, :));

% Integration loop
for n = 1:N-1
    % Current state and time
    t_n = t(n);
    S_n = S(n, :)';
    
    % Compute four slopes (Butcher tableau for RK4)
    k1 = h_actual * two_body_ode(t_n, S_n, mu);
    k2 = h_actual * two_body_ode(t_n + h_actual/2, S_n + k1/2, mu);
    k3 = h_actual * two_body_ode(t_n + h_actual/2, S_n + k2/2, mu);
    k4 = h_actual * two_body_ode(t_n + h_actual, S_n + k3, mu);
    
    % Update state using weighted average of slopes
    S(n+1, :) = (S_n + (k1 + 2*k2 + 2*k3 + k4) / 6)';
    
    % Compute invariants at new state
    E(n+1) = compute_energy(S(n+1, :), mu);
    L(n+1) = compute_angular_momentum(S(n+1, :));
end

end

% =========================================================================
% METHOD 3: PREDICTOR-CORRECTOR (Adams-Bashforth-Moulton, O(h²))
% =========================================================================

function [t, S, E, L] = predictor_corrector_solver(t_span, S0, mu, h)
% PREDICTOR_CORRECTOR_SOLVER Two-step Adams-Bashforth-Moulton method
%
% ALGORITHM - TWO-STEP METHOD:
%
% BOOTSTRAP (Step 1): Use RK4 to compute S_1 from S_0
%   This is necessary because multi-step methods need history.
%
% PREDICTOR (Adams-Bashforth, explicit):
%   S*_{n+1} = S_n + (h/2)·[3f_n - f_{n-1}]
%
% CORRECTOR (Adams-Moulton, implicit, solved iteratively):
%   S_{n+1} = S_n + (h/2)·[f_{n+1} + f_n]
%   where f_{n+1} = f(t_{n+1}, S*_{n+1})
%
% CHARACTERISTICS:
%   Local truncation error:  O(h³)
%   Global truncation error: O(h²)
%   Stability: Better than Euler, comparable to RK4
%   Function evaluations: 2 per step after bootstrap
%
% PROS:  Efficient (fewer function evals than RK4), uses problem history
% CONS:  Requires bootstrapping, more complex code
%
% ADVANTAGE OVER SINGLE-STEP:
%   Multi-step methods exploit previous states to improve accuracy
%   Can achieve O(h²) with only 2 function evaluations
%   RK4 needs 4 function evaluations for O(h⁴)

t0 = t_span(1);
tf = t_span(2);

% Compute number of steps
N = round((tf - t0) / h) + 1;
h_actual = (tf - t0) / (N - 1);

% Pre-allocate arrays
t = linspace(t0, tf, N)';
S = zeros(N, 4);
E = zeros(N, 1);
L = zeros(N, 1);

% Set initial condition
S(1, :) = S0';
E(1) = compute_energy(S(1, :), mu);
L(1) = compute_angular_momentum(S(1, :));

% ========== BOOTSTRAP STEP: Use RK4 for first step ==========
% This is necessary to obtain S_1 and f_0 for the multi-step method

t1 = t0 + h_actual;
S_n = S(1, :)';

k1 = h_actual * two_body_ode(t0, S_n, mu);
k2 = h_actual * two_body_ode(t0 + h_actual/2, S_n + k1/2, mu);
k3 = h_actual * two_body_ode(t0 + h_actual/2, S_n + k2/2, mu);
k4 = h_actual * two_body_ode(t0 + h_actual, S_n + k3, mu);

S(2, :) = (S_n + (k1 + 2*k2 + 2*k3 + k4) / 6)';
E(2) = compute_energy(S(2, :), mu);
L(2) = compute_angular_momentum(S(2, :));

% Store function evaluations for Adams methods
f_prev = two_body_ode(t(1), S(1, :), mu);      % f(t_0, S_0)
f_curr = two_body_ode(t(2), S(2, :), mu);      % f(t_1, S_1)

% ========== MULTI-STEP LOOP (n ≥ 2) ==========

for n = 2:N-1
    t_n = t(n);
    t_next = t(n+1);
    S_n = S(n, :)';
    
    % ===== PREDICTOR STEP (Adams-Bashforth, explicit) =====
    % Predict next state using history
    S_pred = S_n + (h_actual / 2) * (3*f_curr - f_prev);
    
    % ===== CORRECTOR STEP (Adams-Moulton, implicit) =====
    % Correct prediction using future slope (fixed-point iteration)
    f_next_pred = two_body_ode(t_next, S_pred, mu);
    
    % Simple fixed-point iteration (typically 1-2 iterations sufficient)
    S_corrected = S_n + (h_actual / 2) * (f_next_pred + f_curr);
    f_next = two_body_ode(t_next, S_corrected, mu);
    
    % Store corrected solution
    S(n+1, :) = S_corrected';
    E(n+1) = compute_energy(S(n+1, :), mu);
    L(n+1) = compute_angular_momentum(S(n+1, :));
    
    % Shift function values for next iteration
    f_prev = f_curr;
    f_curr = f_next;
end

end

% =========================================================================
% METHOD 4: MATLAB ODE45 (Adaptive RK45, Reference Solution)
% =========================================================================

function [t, S, E, L] = ode45_solver(t_span, S0, mu, h_max)
% ODE45_SOLVER MATLAB's built-in adaptive Runge-Kutta 4/5 solver
%
% CHARACTERISTICS:
%   - Adaptive step-size control based on error estimation
%   - Embedded RK4-RK5 pair (Dormand-Prince method)
%   - Local error control: adjusts h to meet tolerance
%   - Excellent for stiff/smooth problems
%
% USAGE:
%   Serves as REFERENCE SOLUTION for convergence studies
%   Cannot be used to demonstrate "manual implementation" but essential
%   for validation and error analysis
%
% ADVANTAGES:
%   - Automatically selects step sizes for accuracy
%   - Detects stiffness and adjusts algorithm
%   - Production code quality
%
% DISADVANTAGES:
%   - Black box (don't learn algorithm implementation from this)
%   - Overkill for simple systems like two-body problem

% Ensure S0 is column vector for ode45
if size(S0, 1) == 1
    S0 = S0';
end

% Define ODE function handle
odefun = @(t, S) two_body_ode(t, S, mu);

% Set solver options
% RelTol: relative error tolerance (default 1e-3)
% AbsTol: absolute error tolerance (default 1e-6)
% MaxStep: maximum step size (prevents overshooting)
options = odeset('RelTol', 1e-9, 'AbsTol', 1e-12, 'MaxStep', h_max);

% Solve ODE
[t, S] = ode45(odefun, t_span, S0, options);

% Ensure column vectors
t = t(:);
if size(S, 2) ~= 4
    error('ode45 returned unexpected solution dimensions');
end

% Compute invariants at each time step
N = length(t);
E = zeros(N, 1);
L = zeros(N, 1);

for i = 1:N
    E(i) = compute_energy(S(i, :), mu);
    L(i) = compute_angular_momentum(S(i, :));
end

end

% =========================================================================
% HELPER FUNCTIONS (Duplicated for modularity)
% =========================================================================

function E = compute_energy(S, mu)
if size(S, 2) == 4 && size(S, 1) == 1
    S = S';
end
x  = S(1);
y  = S(2);
vx = S(3);
vy = S(4);
r = sqrt(x^2 + y^2);
v_squared = vx^2 + vy^2;
if r < 1e-10
    E = inf;
else
    E = 0.5 * v_squared - mu / r;
end
end

function L = compute_angular_momentum(S)
if size(S, 2) == 4 && size(S, 1) == 1
    S = S';
end
x  = S(1);
y  = S(2);
vx = S(3);
vy = S(4);
L = abs(x * vy - y * vx);
end

% =========================================================================
% END OF manual_solvers.m
% =========================================================================