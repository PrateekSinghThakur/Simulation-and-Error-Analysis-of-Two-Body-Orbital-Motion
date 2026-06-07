function [t_interp, S_interp] = lagrange_interp(t_nodes, S_nodes, t_query)
% LAGRANGE_INTERP Lagrange polynomial interpolation (Module 4)
%
% DESCRIPTION:
%   Constructs a Lagrange interpolating polynomial from discrete data points
%   and uses it to estimate values at new query times.
%
% MATHEMATICAL FOUNDATION:
%   Given n+1 data points (t_i, S_i), i=0..n, construct polynomial P(t)
%   of degree n such that P(t_i) = S_i for all data points.
%
%   Lagrange Form:
%     P(t) = ∑_{i=0}^n S_i · L_i(t)
%
%   Basis Polynomials (Lagrange basis):
%     L_i(t) = ∏_{j=0, j≠i}^n (t - t_j) / (t_i - t_j)
%
%   Properties:
%     - L_i(t_j) = δ_{ij} (Kronecker delta)
%     - Each L_i(t) is degree n
%     - Sum of all L_i(t) = 1 for all t (partition of unity)
%
% ADVANTAGES:
%   ✓ Exact at nodes
%   ✓ Works for arbitrary (non-uniform) node spacing
%   ✓ Intuitive mathematical form
%
% DISADVANTAGES:
%   ✗ Runge phenomenon: oscillations with many nodes
%   ✗ No easy error estimation (unlike piecewise methods)
%   ✗ O(n²) operations for n interpolations
%
% INPUT:
%   t_nodes  - Time points where solution is known (column vector, n×1)
%   S_nodes  - State values at t_nodes (n×4 matrix)
%              Each row i contains [x, y, vx, vy] at time t_i
%   t_query  - Times where interpolated values are requested (m×1)
%
% OUTPUT:
%   t_interp - Copy of t_query (m×1)
%   S_interp - Interpolated state values (m×4 matrix)
%
% EXAMPLE:
%   % Create solution with RK4
%   [t_sol, S_sol, ~, ~] = rk4_solver([0 10], [1 0 0 1], 1.0, 0.1);
%
%   % Select sparse nodes (every 10th point)
%   t_nodes = t_sol(1:10:end);
%   S_nodes = S_sol(1:10:end, :);
%
%   % Interpolate to finer grid
%   t_fine = linspace(t_nodes(1), t_nodes(end), 500)';
%   [t_interp, S_interp] = lagrange_interp(t_nodes, S_nodes, t_fine);
%
% AUTHOR: Numerical Methods Course
% DATE: 2024

% =========================================================================
% INPUT VALIDATION
% =========================================================================

% Ensure inputs are column vectors/matrices
if size(t_nodes, 2) ~= 1
    if size(t_nodes, 1) == 1
        t_nodes = t_nodes';
    else
        error('t_nodes must be a column vector');
    end
end

if size(t_query, 2) ~= 1
    if size(t_query, 1) == 1
        t_query = t_query';
    else
        error('t_query must be a column vector');
    end
end

if size(S_nodes, 2) ~= 4
    error('S_nodes must be an n×4 matrix');
end

if length(t_nodes) ~= size(S_nodes, 1)
    error('Number of time nodes must match number of state rows');
end

% Check for duplicate nodes (ill-conditioned interpolation)
if length(unique(t_nodes)) ~= length(t_nodes)
    warning('Duplicate nodes detected; interpolation may be inaccurate');
end

% =========================================================================
% EXTRAPOLATION WARNING
% =========================================================================

t_min = min(t_nodes);
t_max = max(t_nodes);

if any(t_query < t_min) || any(t_query > t_max)
    warning(['Some query points are outside [%.4f, %.4f] interpolation interval. ' ...
        'Extrapolation may be unreliable.'], t_min, t_max);
end

% =========================================================================
% LAGRANGE INTERPOLATION ALGORITHM
% =========================================================================

n = length(t_nodes);           % Number of nodes (degree n-1 polynomial)
m = length(t_query);           % Number of query points
S_interp = zeros(m, 4);        % Pre-allocate output matrix

% Loop over each query point
for q = 1:m
    t_q = t_query(q);
    
    % Loop over each node (dimension of Lagrange basis)
    for i = 1:n
        % Compute Lagrange basis polynomial L_i(t_q)
        % L_i(t) = ∏_{j≠i} (t - t_j) / (t_i - t_j)
        
        L_i = 1.0;  % Initialize basis polynomial
        
        % Compute product
        for j = 1:n
            if i ~= j
                % Multiply by term (t_q - t_j) / (t_i - t_j)
                numerator = t_q - t_nodes(j);
                denominator = t_nodes(i) - t_nodes(j);
                
                % Guard against division by zero (shouldn't occur if nodes distinct)
                if abs(denominator) < eps
                    warning('Nearly identical nodes detected at indices %d, %d', i, j);
                    L_i = 0;
                    break;
                end
                
                L_i = L_i * (numerator / denominator);
            end
        end
        
        % Accumulate contribution from node i
        % P(t_q) += S_i * L_i(t_q)
        S_interp(q, :) = S_interp(q, :) + S_nodes(i, :) * L_i;
    end
end

% Return output
t_interp = t_query;

% =========================================================================
% VALIDATION: Check that interpolation is exact at nodes
% =========================================================================

% Find indices where query points coincide with nodes
[~, idx_match] = ismember(t_nodes, t_query);
idx_match(idx_match == 0) = [];  % Remove non-matches

if ~isempty(idx_match)
    % Compute error at node locations
    error_at_nodes = max(max(abs(S_interp(idx_match, :) - S_nodes(ismember(t_nodes, t_query(idx_match)), :))));
    
    if error_at_nodes > 1e-10
        warning('Interpolation error at nodes exceeds tolerance: %.2e', error_at_nodes);
    end
end

end

% =========================================================================
% END OF lagrange_interp.m
% =========================================================================