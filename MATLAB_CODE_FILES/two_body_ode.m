function dSdt = two_body_ode(t, S, mu)
% TWO_BODY_ODE Governing equations for two-body gravitational system
%
% DESCRIPTION:
%   Converts second-order Newtonian gravity equations into a system of
%   four first-order ODEs using standard reduction technique.
%
% GOVERNING EQUATIONS (2nd order):
%   r̈ = -μr/|r|³  [Newton's law of gravitation]
%
% REDUCTION TO 1st ORDER SYSTEM:
%   Let S = [x, y, vx, vy]
%   Then:
%     dx/dt = vx
%     dy/dt = vy
%     dvx/dt = -μx/r³
%     dvy/dt = -μy/r³
%   where r = √(x² + y²)
%
% INPUT:
%   t   - Time (scalar, seconds or nondimensional units)
%   S   - State vector [x, y, vx, vy] (1x4 or 4x1)
%   mu  - Standard gravitational parameter (scalar, default = 1.0)
%
% OUTPUT:
%   dSdt - Time derivatives [dx/dt, dy/dt, dvx/dt, dvy/dt] (4x1 column)
%
% PHYSICAL CONSTANTS (Nondimensional):
%   mu = 1.0 corresponds to Earth-like orbit with r=1 AU, v=1 AU/year
%
% AUTHOR: Numerical Methods Course
% DATE: 2024

% Ensure S is column vector
if size(S, 2) == 4 && size(S, 1) == 1
    S = S';
end

% Extract state components
x  = S(1);
y  = S(2);
vx = S(3);
vy = S(4);

% Compute distance from origin (central body at origin)
r = sqrt(x^2 + y^2);

% Guard against singularity at origin
if r < 1e-10
    % At singularity, accelerations become undefined; set to zero
    ax = 0;
    ay = 0;
else
    % Compute accelerations from Newton's law
    ax = -mu * x / r^3;
    ay = -mu * y / r^3;
end

% Assemble derivative vector
dSdt = [vx; vy; ax; ay];

end

% =========================================================================
% HELPER FUNCTIONS FOR INVARIANT COMPUTATION
% =========================================================================

function E = compute_energy(S, mu)
% COMPUTE_ENERGY Specific mechanical energy
%   E = (1/2)|v|² - μ/r
%   
% Positive: unbound orbit (parabolic or hyperbolic)
% Negative: bound orbit (elliptical or circular)
% Zero: parabolic (escape trajectory)

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
    E = inf;  % Singularity
else
    E = 0.5 * v_squared - mu / r;
end
end

function L = compute_angular_momentum(S)
% COMPUTE_ANGULAR_MOMENTUM Angular momentum magnitude (2D)
%   L = |r × v| = |x*vy - y*vx|
%   
% Should remain constant in absence of external torques.
% In 2D, returns scalar (z-component of 3D cross product).

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
% END OF two_body_ode.m
% =========================================================================